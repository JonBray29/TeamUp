$(function(){
    //Classes
    //Notification - type, message, date, userEmail
    class Notification {
        constructor(type, message, date, userEmail) {
            this.type = type;
            this.message = message;
            this.date = date;
            this.userEmail = userEmail;
        }
    }
    //Events, factory?
    class event{
        constructor(title, start, end, allDay){
            this.title = title;
            this.start = start;
            this.end = end;
            this.allDay = allDay;
        }
    }
    class Holiday extends Event{
        constructor(title, start, end, allDay){
            super(title, start, end, allDay);
        }
    }
    class Meeting extends Event{
        constructor(title, start, end, allDay){
            super(title, start, end, allDay);
        }
    }
    class Milestone extends Event{
        constructor(title, start, end, allDay){
            super(title, start, end, allDay);
        }
    }
    class Time extends Event{
        constructor(title, start, end, allDay){
            super(title, start, end, allDay);
        }
    }
    class EventsFactory {
        constructor(type, title, start, end, allDay){
            switch(type){
                case "Holiday":
                    return new Holiday(title, start, end, allDay);
                break;
                case "Meeting":
                    return new Meeting(title, start, end, allDay);
                break;
                case "Milestone":
                    return new Milestone(title, start, end, allDay);
                break;
                case "Time":
                    return new Time(title, start, end, allDay);
                break;
                default: 
                    console.log("Event not found.");
            }
        }
    }
    //Global variables
    var socket;
    var calendar;
    //Declare arrays
    var holidayArray = [];
    var meetingArray = [];
    var milestoneArray = [];
    var timeArray = [];
    //Start the time
    showTimeAndDate();
    showCalendar();
    //Login dialog
    $("#login-modal").iziModal({
        overlayClose: false,
        overlayColor: 'rgba(0, 0, 0, 0.6)'
    });
    $("#login-modal").iziModal("open"); 
    if(localStorage.email != undefined){
        $("#login-email").val(localStorage.email);
    }
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

        let validation = false;

        if(!validator.isEmail($("#login-email").val())){
            if($("label[for=login-email] span").length == 0){
                $("label[for=login-email]").append("<span class='validation'> Ensure you have entered a valid email.</span>");
            }
            validation = true;
        }
        else{
            $("label[for=login-email]").find("span").remove();
        }
        if(validator.isEmpty($("#login-password").val())){
            if($("label[for=login-password] span").length == 0){
                $("label[for=login-password]").append("<span class='validation'> Ensure you have entered your password.</span>");
            }
            validation = true;
        }
        else{
            $("label[for=login-password]").find("span").remove();
        }

        if(!validation){
            $.post("http://localhost:9000/login", { email: $("#login-email").val(), password: $("#login-password").val() }, function(res){
                if(res.status == 200){
                    if($("#login-remember-me").prop("checked")){
                        localStorage.setItem("email", $("#login-email").val());
                    }
                    handleArrays(res);
                    openSocket(res);               
                    $("#login-modal").iziModal("close");
                }
                else if(res.status == 400){
                    validationError(res);
                }
                else{
                    console.log(res.status);
                }
            });
        }
    }); 
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
        calendar.refetchEvents();
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
                $("#notifications-dialog").find("section").append("<div id='id'>" + title + time + dismiss + "</div>");
            }
            else{
                let title = "<h1>" + "New Request: " + notification.userEmail + "</h1>";
                $("#notifications-dialog").find("section").append("<div id='" + id + "'>" + title + time + reject + accept + "</div>");
            }
    }
    
    $("#login-modal").on('click', '.submit-signup', function(e){
        e.preventDefault();
        let validation = false;

        if(!validator.isEmail($("#signup-email").val())){
            if($("label[for=signup-email] span").length == 0){
                $("label[for=signup-email").append("<span class='validation'> Ensure you have entered a valid email.</span>");
            }
            validation = true;
        }
        else{
            $("label[for=signup-email]").find("span").remove();
        }
        if(validator.isEmpty($("#signup-team").val())){
            if($("label[for=signup-team] span").length == 0){
                $("label[for=signup-team]").append("<span class='validation'> Ensure that you have entered a team name.</span>");
            }
            validation = true;
        }
        else{
            $("label[for=signup-team]").find("span").remove();
        }
        if(!validator.isStrongPassword($("#signup-password").val(), { minSymbols: 0 })){
            if($("label[for=signup-password] span").length == 0){
                $("label[for=signup-password]").append("<span class='validation'> Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.</span>")
            }
            validation = true;
        }
        else{
            $("label[for=signup-password]").find("span").remove();
        }
        if($("#signup-password").val() != $("#signup-password-confirm").val()){
            if($("label[for=signup-password-confirm] span").length == 0){
                $("label[for=signup-password-confirm]").append("<span class='validation'> Ensure that passwords match.</span>")
            }
            validation = true;
        }
        else{
            $("label[for=signup-password-confirm]").find("span").remove();
        }
        if(!validation){
            if($("#signup-team-check").prop("checked")){
                //new team
                $.post("http://localhost:9000/createTeam", { teamName: $("#signup-team").val(), email: $("#signup-email").val(), pass: $("#signup-password").val()}, function(res){
                    
                    switch(res.status){
                        case 200: 
                            signUpSuccess($("#signup-email").val());
                            break;
                        case 400: 
                            validationError(res);
                            break;
                        default: 
                            console.log(res.status);
                    }
                });
            }
            else{
                let notification = new Notification("Request", "Request", moment().format(), $("#signup-email").val());
                //join team
                $.post("http://localhost:9000/joinTeam", { teamName: $("#signup-team").val(), email: $("#signup-email").val(), pass: $("#signup-password").val(), notification: notification }, function(res){
                    
                    switch(res.status){
                        case 200: 
                            signUpSuccess($("#signup-email").val());
                            break;
                        case 400: 
                            validationError(res);
                            break;
                        default: 
                            console.log(res.status);
                    }
                });
            }
        }
    });
    function validationError(res){ 
        console.log(res.message);
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
    }
    function signUpSuccess(email){
        $("#login-modal").find("header").find("a").toggleClass("active");
        $("#login-modal").find("section").not("hide").find("input").val('');
        $("#login-modal").find("section").toggleClass("hide");
        $("#login-email").val(email);
    }
    //Notification dialog
    $("#notifications-dialog").iziModal({
        overlayClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.2)',
        top: '10vh',
        transitionIn: 'fadeInDown',
        transitionOut: 'fadeOutUp'
    });
    $("#notifications-dialog").on('click', '.dismiss', function(e){
        let id = $(this).parent('div').attr('id');

        removeItem("Notification", id);
        $(this).parent('div').remove();
    });
    $("#notifications-dialog").on('click', '.accept', function(e){
        let id = $(this).parent('div').attr('id');
        socket.emit("Accept User", id);
        removeItem("Notification", id);
        $(this).parent('div').remove();
    });
    $("#notifications-dialog").on('click', '.reject', function(e){
        let id = $(this).parent('div').attr('id');
        socket.emit("Reject User", id);
        removeItem("Notification", id);
        $(this).parent('div').remove();
    });
    //Event dialog
    $("#events-dialog").iziModal({
        overlayClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.6',
        focusInput: false
    });
    const startDate = flatpickr("#event-start", {
        enableTime: true,
        time_24hr: true,
        altInput: true,
        altFormat: "H:i - l J F Y",
        dateFormat: "Z",
        minDate: "today",
        onChange: function(selected, dateString, instance){
            endDate.config.minDate = dateString;
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
    //Gets the current time and date and displays it, updates it every second.
    function showTimeAndDate(){
        let newDate = new Date();
        let time = newDate.toLocaleTimeString();
        let date = constructDate();
        $("#time").html(time);
        $("#date").html(date);
        setTimeout(showTimeAndDate, 1000);
    }
    function constructDate(){
        let newDate = new Date();
        let weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let month = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

        let date = weekday[newDate.getDay()] + " ";
        date += newDate.getDate() + getOrdinal(newDate.getDate()) + " ";
        date += month[newDate.getMonth()] + " ";
        date += newDate.getFullYear();

        return date;
    }
    function getOrdinal(date){
        if(date > 3 && date < 21) return "th";
        switch (date % 10){
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
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
                $("#events-dialog").iziModal('open');
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
                //SEND NOTIFICATION ----------------------------------------------------------------------------------------------------------------
            }
            $("#new-task").text("");
        }
    })
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
    var removeItem;
    $("#todo-list").on('click', function(event){
        let target = $(event.target);
        if(target.hasClass("list-item")){
            target.addClass("checked");
            
            if(target.hasClass("checked")){
                target.fadeTo(5000, 0.5);
                removeItem = setTimeout(function(){
                    removeItem("Task", target.attr(id));
                    target.remove();
                }, 5000);
            }
        }
    });

    var timer = new easytimer.Timer();
    timer.addEventListener('secondsUpdated', function(e){
        $("#stopwatch").html(timer.getTimeValues().toString());
    });
    timer.addEventListener('reset', function(e){
        $("#stopwatch").html(timer.getTimeValues().toString());
    });
    //Start time tracking
    $("#play").on('click', function(e){
        timer.start();

        $("#play").toggleClass('hide');
        $("#pause").toggleClass('hide');
        $("#stop").removeClass('hide');
        //Start time, toggle class (hide play and show pause and stop)
    });
    $("#pause").on('click', function(e){
        //Pause time and toggle class (hide pause, show play)
        timer.pause();

        $("#play").toggleClass('hide');
        $("#pause").toggleClass('hide');
    });
    $("#stop").on('click', function(e){
        //Else error asking for name of event
        if(!validator.isEmpty($("#time-task").val())){
            timer.stop();
            //ADD TIME EVENT TO CALENDAR AND DB ------------------------------
            let time = timer.getTimeValues();
            let title = $("#time-task").val();
            //let name = localstorage display name -----------------------------
            
            $("#time-task").val('');
            timer.reset();
            timer.pause();

        }
        else{
            console.log('Please enter an task title'); //CHANGE ERROR MESSAGE, RED OUTLINE ON THE BOX ----------
        }
    });
    const observer = new MutationObserver(function(){
        $("#notifications-dialog").trigger("mutated");
    });
    observer.observe($("#notifications-dialog")[0], { childList: true, subtree: true });
    $("#notifications-dialog").on("mutated", function(){
        if($("#notifications-dialog").find("section").find("div").length != 0){
            $("#notifications").attr("src", "Icons/icons8-notification-100-red.png");
        }
        else{
            $("#notifications").attr("src", "Icons/icons8-notification-100.png");
        }
    });
    //Socket.io code
    function openSocket(res){
        socket = io("http://localhost:9000");

        socket.on ("connect", function(){
            socket.emit('join', { teamId: res.teamId, email: $("#login-email").val() });
            socket.on("Notification", function(notification){
                setNotification(notification);
            });
        });
        socket.on("Send Task", function(task){
            setTask(task);
        })
    }
    function removeItem(type, id){
        socket.emit('Remove', { type: type, id: id });
    }
})