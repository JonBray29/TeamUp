$(function(){
    //DEFINE CLASSES AND VARIBLES -------------------------------------------------------------------------------------------------------------------
    //Notification class
    class Notification {
        constructor(type, message, date, email) {
            this.type = type;
            this.message = message;
            this.date = date;
            this.userEmail = email;
        }
    }
    //Events class with subclasses and factory
    class Event{
        constructor(id, title, start, end, allDay, type){
                this._id = id;
                this.title = title;
                this.start = start;
                this.end = end;
                this.allDay = allDay;
                this.type = type;
        }
    }
    class Holiday extends Event{
        constructor(id, title, start, end, allDay, type){
            super(id, title, start, end, allDay, type);
        }
    }
    class Meeting extends Event{
        constructor(id, title, start, end, allDay, type){
            super(id, title, start, end, allDay, type);
        }
    }
    class Milestone extends Event{
        constructor(id, title, start, end, allDay, type){
            super(id, title, start, end, allDay, type);
        }
    }
    class Time extends Event{
        constructor(id, title, start, end, allDay, type){
            super(id, title, start, end, allDay, type);
        }
    }
    class EventsFactory {
        constructor(type, id, title, start, end, allDay){
            switch(type){
                case "Holiday":
                    return new Holiday(id, title, start, end, allDay, type);
                break;
                case "Meeting":
                    return new Meeting(id, title, start, end, allDay, type);
                break;
                case "Milestone":
                    return new Milestone(id, title, start, end, allDay, type);
                break;
                case "Time":
                    return new Time(id, title, start, end, allDay, type);
                break;
                default: 
                    console.log("Event not found.");
            }
        }
    }
    //Global variables
    var socket;
    var calendar;
    var uriPrefix = "https://teamuphub.herokuapp.com" || "https://localhost:9000";
    var timer = new easytimer.Timer();
    const startDate = flatpickr("#event-start", {
        enableTime: true,
        time_24hr: true,
        altInput: true,
        altFormat: "H:i - l J F Y",
        dateFormat: "Z",
        minDate: "today",
        onChange: function(selected, dateString, instance){
            endDate.config.minDate = dateString;
            endDate.setDate(moment(dateString).add(1, "h").format());
        }
    });
    const endDate = flatpickr("#event-end", {
        enableTime: true,
        time_24hr: true,
        altInput: true,
        altFormat: "H:i - l J F Y",
        dateFormat: "Z",
        minDate: "today"
    });
    const observer = new MutationObserver(function(){
        $("#notifications-dialog").trigger("mutated");
    });
    observer.observe($("#notifications-dialog")[0], { childList: true, subtree: true });
    //Arrays
    var holidayArray = [];
    var meetingArray = [];
    var milestoneArray = [];
    var timeArray = [];
    //DEFINE MODALS ---------------------------------------------------------------------------------------------------------------------------------
    //Login dialog
    $("#login-modal").iziModal({
        overlayClose: false,
        overlayColor: 'rgba(0, 0, 0, 0.6)'
    });
    //Notification dialog
    $("#notifications-dialog").iziModal({
        overlayClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.2)',
        top: '10vh',
        transitionIn: 'fadeInDown',
        transitionOut: 'fadeOutUp'
    });
    //Events dialog
    $("#events-dialog").iziModal({
        overlayClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.6',
        focusInput: false, 
        onClosed: function(){
            $("#event-name").val('');
            $("#event-start").val('');
            $("#event-end").val('');
            $("#event-type").val('');
            $("label[for=event-type]").removeClass("hide");
            $("#event-type").removeClass("hide");
        }
    });
    //FUNCTIONS -------------------------------------------------------------------------------------------------------------------------------------
    //On app load functions
    showTimeAndDate();
    showCalendar();
    getEmail(); 
    $("#login-modal").iziModal("open"); //Opens login dialog
    //CORE LOGIC ------------------------------------------------------------------------------------------------------------------------------------
    //Gets the current time and date and displays it, updates it every second.
    function showTimeAndDate(){
        let time = getTime();
        let date = getDate();
        $("#time").html(time);
        $("#date").html(date);
        setTimeout(showTimeAndDate, 1000);
    }
    function getTime(){
        return moment().format("HH:mm:ss");
    }
    function getDate(){
        return moment().format("dddd Do MMMM YYYY");
    }
    //Show calendar on page 
    function showCalendar(){
        let date = new Date();

        var calendarEl = document.getElementById('calendar');
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'gb',
            firstDay: 1,
            scrollTime: date.toLocaleTimeString(),
            slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                meridiam: false
            },
            dayHeaderFormat: {
                weekday: 'long',
                day: 'numeric',
                month: 'numeric',
                omitCommas: true
            },
            dateClick: function(info){
                if(!validator.isAfter(info.dateStr)){
                    iziToast.show({
                        title: 'Invalid date selection',
                        message: "Please select a date after today.",
                        theme: "dark",
                        iconUrl: "https://img.icons8.com/pastel-glyph/64/ffffff/error--v1.png",
                        position: "bottomCenter",
                        pauseOnHover: false,
                        transitionIn: "fadeInUp",
                        transitionOut: "fadeOutDown",
                        color: "#404040",
                        displayMode: 2
                    })
                }
                else{
                    startDate.setDate(info.dateStr);
                    endDate.setDate(moment(info.dateStr).add(1, "h").format());
                    $("label[for=event-type]").removeClass("hide");
                    $("#event-type").removeClass("hide");
                    $("#save-event").removeClass('hide');
                    $("#update-event").addClass('hide');
                    $("#delete-event").addClass('hide');
                    $("#events-dialog").find("input").removeAttr("disabled");
                    $("#events-dialog").iziModal('open');
                }
            },
            eventClick: function(info){
                $("#event-name").val(info.event.title);
                startDate.setDate(info.event.start);
                endDate.setDate(info.event.end);
                $("#event-id").text(info.event.extendedProps._id);
                $("#event-type-hidden").text(info.event.extendedProps.type);

                if(info.event.type == "Time"){
                    $("label[for=event-type]").addClass("hide");
                    $("#event-type").addClass("hide");
                    $("#save-event").addClass("hide");
                    ("#update-event").addClass("hide");
                    $("#delete-event").removeClass("hide");

                    $("#events-dialog").find("input").attr("disabled", "disabled");
                }
                else{
                    $("label[for=event-type]").addClass("hide");
                    $("#event-type").addClass("hide");
                    $("#save-event").addClass("hide");
                    $("#update-event").removeClass("hide");
                    $("#delete-event").removeClass("hide");

                    $("#events-dialog").find("input").removeAttr("disabled");
                }
                $("#events-dialog").iziModal('open');
            },
            eventMouseEnter: function(info){
                $(info.el).addClass("hvr-grow");
            },
            eventSources: [
                { events: holidayArray, color: 'rgb(0, 182, 255)', textColor: 'white' },
                { events: meetingArray, color: 'rgb(236, 0, 0)', textColor: 'white' },
                { events: milestoneArray, color: 'rgb(255, 206, 0)', textColor: 'white' },
                { events: timeArray, color: 'rgb(162, 0, 255)', textColor: 'white' }
            ]
        });
        calendar.render();
    }
    //Get and set email to localstorage
    function getEmail(){
        if(localStorage.email != undefined){
            $("#login-email").val(localStorage.email);
        }
    }
    function setEmail(email){
        localStorage.setItem("email", email);
    }
    //Validation
    function validation(type, data){
        switch(type){
            case "submitLogin":
                return validateSubmitLogin(data);
            case "submitSignup":
                return validateSubmitSignup(data);
            case "event":
                return validateEvent(data);
            default:
                console.log("Validation type not found.");
        }
    }
    function validateSubmitLogin(data){
        let isValidated = true;

        if(!validator.isEmail(data.email)){
            if($("label[for=login-email] span").length == 0){
                $("label[for=login-email]").append("<span id='hi' class='validation'> Ensure you have entered a valid email.</span>");
            }
            isValidated = false;
        }
        else{
            $("label[for=login-email]").find("span").remove();
        }
        if(validator.isEmpty(data.password)){
            if($("label[for=login-password] span").length == 0){
                $("label[for=login-password]").append("<span class='validation'> Ensure you have entered your password.</span>");
            }
            isValidated = false;
        }
        else{
            $("label[for=login-password]").find("span").remove();
        }
        return isValidated;
    }
    function validateSubmitSignup(data){
        let isValidated = true;

        if(!validator.isEmail(data.email)){
            if($("label[for=signup-email] span").length == 0){
                $("label[for=signup-email").append("<span class='validation'> Ensure you have entered a valid email.</span>");
            }
            isValidated = false;
        }
        else{
            $("label[for=signup-email]").find("span").remove();
        }
        if(validator.isEmpty(data.team)){
            if($("label[for=signup-team] span").length == 0){
                $("label[for=signup-team]").append("<span class='validation'> Ensure that you have entered a team name.</span>");
            }
            isValidated = false;
        }
        else{
            $("label[for=signup-team]").find("span").remove();
        }
        if(!validator.isStrongPassword(data.password, { minSymbols: 0 })){
            if($("label[for=signup-password] span").length == 0){
                $("label[for=signup-password]").append("<span class='validation'> Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.</span>")
            }
            isValidated = false;
        }
        else{
            $("label[for=signup-password]").find("span").remove();
        }
        if(data.password != data.confirmPassword){
            if($("label[for=signup-password-confirm] span").length == 0){
                $("label[for=signup-password-confirm]").append("<span class='validation'> Ensure that passwords match.</span>")
            }
            isValidated = false;
        }
        else{
            $("label[for=signup-password-confirm]").find("span").remove();
        }
        return isValidated;
    }
    function validateEvent(data){
        let isValidated = true;
        let start;
        let end;

        if((data.name != "")){
            $("label[for=event-name]").find("span").remove();
        }
        else{
            isValidated = false;
            if($("label[for=event-name] span").length == 0){
                $("label[for=event-name]").append("<span class='validation'> Ensure you have entered an event name.</span>");
            }
        }
        if(startDate.selectedDates.length != 0){
            start = startDate.formatDate(startDate.selectedDates[0], "Z");
            $("label[for=event-start]").find("span").remove();
            if(!validator.isAfter(start)){
                isValidated = false;
                $("label[for=event-start]").append("<span class='validation'> Ensure you have selected a date and time after now.</span>");
            }
        }
        else{
            isValidated = false;
            if($("label[for=event-start] span").length == 0){
                $("label[for=event-start]").append("<span class='validation'> Ensure you have selected a start date.</span>");
            }
        }
        if(endDate.selectedDates.length != 0){
            end = endDate.formatDate(endDate.selectedDates[0], "Z");
            $("label[for=event-end]").find("span").remove();
            if(!validator.isAfter(end, start)){
                isValidated = false;
                $("label[for=event-end]").append("<span class='validation'> Ensure you have selected a date and time after the start date and time.</span>");
            }
        }
        else{
            isValidated = false;
            if($("label[for=event-end] span").length == 0){
                $("label[for=event-end]").append("<span class='validation'> Ensure you have selected an end date.</span>");
            }
        }

        return isValidated;
    }
    function resValidation(res){ 
        if(res.message == "email"){
            $("label[for=signup-email]").append("<span class='validation'> Email is linked to an existing account.</span>");
        }
        else if(res.message == "teamNameExists"){
            $("label[for=signup-team]").append("<span class='validation'> Team name already exists.</span>");
        }
        else if(res.message == "teamNameNonExistent"){
            $("label[for=signup-team]").append("<span class='validation'> Team does not exist.</span>");
        }
        else if(res.message == "incorrectEmail"){
            $("label[for=login-email]").append("<span class='validation'> Email entered is not registered.</span>");
        }
        else if(res.message == "incorrectPassword"){
            $("label[for=login-password]").append("<span class='validation'> Password is incorrect.</span>");
        }
        else if(res.message == "notAccepted"){
            $("label[for=login-email]").append("<span class='validation'> Account not yet accepted into team.</span>");
        }
    }
    //Login post request
    function login(email, password, isChecked){
        $.post(uriPrefix + "/login", { email: email, password: password }, function(res){
            if(res.status == 200){
                if(isChecked){
                    setEmail($("#login-email").val());
                }
                handleArrays(res);
                openSocket(res);               
                $("#login-modal").iziModal("close");
            }
            else if(res.status == 400){
                resValidation(res);
            }
            else{
                console.log(res.status);
            }
        });
    }
    //Create team post request
    function signup(type, data){
        switch(type){
            case "create":
                $.post(uriPrefix + "/createTeam", { teamName: data.team, email: data.email, pass: data.password }, function(res){
                    
                    switch(res.status){
                        case 200: 
                            signUpSuccess(data.email);
                            break;
                        case 400: 
                            resValidation(res);
                            break;
                        default: 
                            console.log(res.status);
                    }
                });
            break;
            case "join":
                let notification = new Notification("Request", "Request", moment().format(), data.email);

                $.post(uriPrefix + "/joinTeam", { teamName: data.team, email: data.email, pass: data.password, notification: notification }, function(res){
                    
                    switch(res.status){
                        case 200: 
                            signUpSuccess(data.email);
                            break;
                        case 400: 
                            resValidation(res);
                            break;
                        default: 
                            console.log(res.status);
                    }
                });
            break;
        }
    }
    //Signup success email
    function signUpSuccess(email){
        $("#login-modal").find("header").find("a").toggleClass("active");
        $("#login-modal").find("section").not("hide").find("input").val('');
        $("#login-modal").find("section").toggleClass("hide");
        $("#login-email").val(email);
    }
    //Handle arrays and set tasks, calendar and notifications
    function handleArrays(res){
        res.tasks.forEach(function(task){
            setTask(task);
        });
        res.notifications.forEach(function(notification){
            setNotification(notification);
        });
        holidayArray = res.holidays;
        meetingArray = res.meetings;
        milestoneArray = res.milestones;
        timeArray = res.times;

        refreshCalendar();
    }
    function setTask(task){
        $("#todo-list").append("<li id='" + task._id + "' class=\"list-item\">" + task.task + "</li>")
    }
    function setNotification(notification){
        let time = "<time>" + moment(notification.date).format("MMM Do YYYY @ HH:mm") + "</time>";
        let dismiss = "<button class='hvr-grow dismiss'>Dismiss</button>";
        let accept = "<button class='hvr-grow accept'>Accept</button>";
        let reject = "<button class='hvr-grow reject'>Reject</button>";
        let id = notification._id;
        if(notification.type == "Event"){
            let title = "<h1>" + "New event: " + notification.message + "</h1>";
            $("#notifications-dialog").find("section").prepend("<div id='" + id + "'>" + title + time + dismiss + "</div>");
        }
        else if(notification.type == "Task"){
            let title = "<h1>" + "New task: " + "'" + notification.message + "'" + " added by - " + notification.userEmail + "</h1>";
            $("#notifications-dialog").find("section").prepend("<div id='" + id + "'>" + title + time + dismiss + "</div>");
        }
        else{
            let title = "<h1>" + "New Request: " + notification.userEmail + "</h1>";
            $("#notifications-dialog").find("section").prepend("<div id='" + id + "'>" + title + time + reject + accept + "</div>");
        }
    }
    //Update calendar with new/updated event arrays
    function refreshCalendar() {
        calendar.getEventSources().forEach(source => source.remove());
        calendar.addEventSource({events: holidayArray, color: 'rgb(0, 182, 255)', textColor: 'white' });
        calendar.addEventSource({ events: meetingArray, color: 'rgb(161, 11, 0)', textColor: 'white' });
        calendar.addEventSource({ events: milestoneArray, color: 'rgb(8, 133, 43)', textColor: 'white' });
        calendar.addEventSource({ events: timeArray, color: 'rgb(162, 0, 255)', textColor: 'white' });

        calendar.refetchEvents();
    }
    //Remove task from task list
    function removeTask(id){
        let item = $("#" + id);

        item.addClass("checked");
        item.fadeTo(5000, 0.5);
            setTimeout(function(){
                item.remove();
            }, 5000);
    }
    //Toggle notification icon colour
    function toggleNotificationIcon(){
        if($("#notifications-dialog").find("section").find("div").length != 0){
            $("#notifications").attr("src", "Icons/icons8-notification-100-red.png");
        }
        else{
            $("#notifications").attr("src", "Icons/icons8-notification-100.png");
        }
    }
    //Get new id from from mongoose
    async function getNewId(callback){
        await $.post(uriPrefix + "/id", function(res){
            callback(res);
        });
    }
    //Add new event to array
    function newEvent(event){
        switch(event.type){
            case "Holiday":
                holidayArray.push(event);
            break;
            case "Meeting":
                meetingArray.push(event);
            break;
            case "Milestone":
                milestoneArray.push(event);
            break;
            case "Time":
                timeArray.push(event);
            break;
            default: 
                console.log("Event not found.");
        }

        refreshCalendar()
    }
    //Add updated event to array
    function updateEvent(data){
        switch(data.type){
            case "Holiday":
                holidayArray = data.array;
            break;
            case "Meeting":
                meetingArray = data.array;
            break;
            case "Milestone":
                milestoneArray = data.array;
            break;
            default: 
                console.log("Event not found.");
        }
        refreshCalendar();
    }
    //Delete event from array
    function deleteEvent(data){
        switch(data.type){
            case "Holiday":
                holidayArray = data.array;
            break;
            case "Meeting":
                meetingArray = data.array;
            break;
            case "Milestone":
                milestoneArray = data.array;
            break;
            case "Time":
                timeArray = data.array;
            default: 
                console.log("Event not found.");
        }
        refreshCalendar();
    }
    //EVENT HANDLERS --------------------------------------------------------------------------------------------------------------------------------
    //Switch views on modal
    $("#login-modal").on("click", "header a", function(e){
        e.preventDefault();
        let index = $(this).index();
        $(this).addClass('active').siblings('a').removeClass('active');
        $(this).parents("div").find("section").eq(index).removeClass('hide').siblings('section').addClass('hide');
    });
    //Submit login dialog
    $("#login-modal").on('click', '.submit-login', function(e) {
        e.preventDefault();
        let loginData = { email: $("#login-email").val(), password: $("#login-password").val() };
        let isValidated = validation("submitLogin", loginData);

        if(isValidated){
            login($("#login-email").val(), $("#login-password").val(), $("#login-remember-me").prop("checked"));
        }
    }); 
    //Submit signup dialog
    $("#login-modal").on('click', '.submit-signup', function(e){
        e.preventDefault();
        let signupData = { email: $("#signup-email").val(), team: $("#signup-team").val(), password: $("#signup-password").val(), confirmPassword: $("#signup-password-confirm").val() };
        let isValidated = validation("submitSignup", signupData);

        if(isValidated){
            if($("#signup-team-check").prop("checked")){
                //Create team
                signup("create", signupData);
            }
            else{
                //Join team
                signup("join", signupData);
            }
        }
    });
    //Notification event handlers
    //Dismiss notification
    $("#notifications-dialog").on('click', '.dismiss', function(e){
        let id = $(this).parent('div').attr('id');
        removeItem("Notification", id);
        $(this).parent('div').remove();
    });
    //Accept new user into team
    $("#notifications-dialog").on('click', '.accept', function(e){
        let id = $(this).parent('div').attr('id');
        socket.emit("Accept User", id);
        $(this).parent('div').remove();
    });
    //Reject new user from team
    $("#notifications-dialog").on('click', '.reject', function(e){
        let id = $(this).parent('div').attr('id');
        socket.emit("Reject User", id);
        $(this).parent('div').remove();
    });
    //Listen for notification dialog change
    $("#notifications-dialog").on("mutated", function(){
        toggleNotificationIcon();
    });
    //Event dialog event handlers
    //Save event
    $("#events-dialog").on('click', '#save-event', function(e){
        let title;
        let start;
        let end;
        let type;
        let allDay;

        let eventData = { name: $("#event-name").val() };
        let isValidated = validation("event", eventData);
        
        if($("#event-type").val() != ""){
            type = $("#event-type").val();
            $("label[for=event-type]").find("span").remove();
            if(type == "Holiday") {
                allDay = true;
            }
            else{
                allDay = false;
            }
        }
        else{
            isValidated = false;
            if($("label[for=event-type] span").length == 0){
                $("label[for=event-type]").append("<span class='validation'> Ensure you have selected an event type.</span>");
            }
        }
        if(isValidated){
            title = $("#event-name").val();
            start = startDate.formatDate(startDate.selectedDates[0], "Z");
            end = endDate.formatDate(endDate.selectedDates[0], "Z");


            getNewId(function(id){
                let event = new EventsFactory(type, id, title, start, end, allDay);
                newEvent(event);

                socket.emit("Send Event", event);
                let notification = new Notification("Event", event.title, moment().format());
                sendNotification(notification);

                $("#events-dialog").iziModal('close');
            });
        }
    });
    //Update event
    $("#events-dialog").on('click', '#update-event', function(e){
        let id;
        let title;
        let start;
        let end;
        let type;

        let eventData = { name: $("#event-name").val() };
        let isValidated = eventValidation("event", eventData);

        if(isValidated){
            id = $("#event-id").html();
            title = $("#event-name").val();
            start = startDate.formatDate(startDate.selectedDates[0], "Z");
            end = endDate.formatDate(endDate.selectedDates[0], "Z");
            type = $("#event-type-hidden").html();
            let event = { id: id, title: title, start: start, end: end, type: type };

            socket.emit("Update Event", event);

            let notification = new Notification("Event", "updated - " + event.title, moment().format());
            sendNotification(notification);

            $("#events-dialog").iziModal('close');
        }
    });
    //Delete event
    $("#events-dialog").on('click', '#delete-event', function(e){
        let id = $("#event-id").html();
        let type = $("#event-type-hidden").html();
        let title = $("#event-name").val();

        let event = { id: id, type: type } ;

        socket.emit("Delete Event", event);

        let notification = new Notification("Event", "deleted - " + title, moment().format());
        sendNotification(notification);

        $("#events-dialog").iziModal('close');
    });
    //Task event handler
    //Listen for click on add new task
    $("#new-task").on('click', function(){
        $("#new-task").removeClass("new-task");
        $("#new-task").removeClass("new-task-blink");
        $("#new-task").addClass("new-task-entered");
    }); 
     //If enter key is pressed when entering a new task
    $("#new-task").on('keypress', function(e){
        if(e.which == 13){
            e.preventDefault();
            if(!validator.isEmpty($("#new-task").text())){
                socket.emit("New Task", $("#new-task").text());

                notification = new Notification("Task", $("#new-task").text(), moment().format(), "");
                sendNotification(notification);
            }
            $("#new-task").text("");
        }
    });
    //On focus out of new task change class
    $("#new-task").on('focusout', function(){
        if(!validator.isEmpty($("#new-task").text())){
            $("#new-task").addClass("new-task-blink");
        }
        else{
            $("#new-task").html("");
            $("#new-task").removeClass("new-task-entered");
            $("#new-task").addClass("new-task");
        }
    });
    //On list item click strikethrough the task
    $("#todo-list").on('click', function(event){
        let target = $(event.target);

        if(target.hasClass("list-item")){
            let id = target.attr('id');
            removeItem("Task", id);
            removeTask(id);
        }
    });
    //Timer event listener
    //Update stopwatch time string on second change
    timer.addEventListener('secondsUpdated', function(e){
        $("#stopwatch").html(timer.getTimeValues().toString());
    });
    //Update stopwatch time string on reset
    timer.addEventListener('reset', function(e){
        $("#stopwatch").html(timer.getTimeValues().toString());
    });
    //Start timer
    $("#play").on('click', function(e){
        timer.start();

        $("#play").toggleClass('hide');
        $("#pause").toggleClass('hide');
        $("#stop").removeClass('hide');
    });
    //Pause timer
    $("#pause").on('click', function(e){
        timer.pause();

        $("#play").toggleClass('hide');
        $("#pause").toggleClass('hide');
    });
    //Stop timer
    $("#stop").on('click', function(e){
        if(!validator.isEmpty($("#time-task").val())){
            let time = timer.getTotalTimeValues().seconds;
            timer.stop();
            $("#play").toggleClass('hide');
            $("#pause").toggleClass('hide');
            $("#stop").addClass('hide');
            start = moment().subtract(time, "s").format();
            end = moment().format();
            title = $("#time-task").val();

            getNewId(function(id){
                let event = new EventsFactory("Time", id, title, start, end, false);
                newEvent(event);
            });

            $("#time-task").val('');
            timer.reset();
            timer.pause();
        }
        else{
            iziToast.show({
                title: 'No time tracking title',
                message: "Please enter a time tracking task name.",
                theme: "dark",
                iconUrl: "https://img.icons8.com/pastel-glyph/64/ffffff/error--v1.png",
                position: "bottomCenter",
                pauseOnHover: false,
                transitionIn: "fadeInUp",
                transitionOut: "fadeOutDown",
                color: "#404040",
                displayMode: 2
            });
        }
    });
    //SOCKET.IO CODE --------------------------------------------------------------------------------------------------------------------------------
    function openSocket(res){
        socket = io(uriPrefix);

        socket.on ("connect", function(){
            socket.emit('join', { teamId: res.teamId, email: $("#login-email").val() });
            socket.on("Notification", function(notification){
                setNotification(notification);
            });
        });
        socket.on("Send Task", function(task){
            setTask(task);
        })
        socket.on("Remove Task", function(id){
            removeTask(id);
        });
        socket.on("New Event", function(event){
            newEvent(event);
        });
        socket.on("Updated Event", function(data){
            updateEvent(data);
        });
        socket.on("Deleted Event", function(data){
            deleteEvent(data);
        })
    }
    //Socket functions 
    function removeItem(type, id){
        socket.emit('Remove', { type: type, id: id });
    }
    function sendNotification(notification){
        socket.emit('New Notification', notification);
    }
})