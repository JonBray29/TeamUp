$(function(){
    //Start the time
    showTimeAndDate();
    showCalendar();
    //Login dialog
    $("#login-modal").iziModal({
        overlayClose: false,
        overlayColor: 'rgba(0, 0, 0, 0.6)'
    });
    $("#login-modal").iziModal("open"); //CHECK LOCAL STORAGE -------------------
    //Switch views on modal
    $("#login-modal").on("click", "header a", function(e){
        e.preventDefault();
        let index = $(this).index();

        $(this).addClass('active').siblings('a').removeClass('active');
        $(this).parents("div").find("section").eq(index).removeClass('hide').siblings('section').addClass('hide');
    });
    //Submit login dialog
    $("#login-modal").on('click', '.submit', function(e) {
        e.preventDefault();

        //TAKE DATA INPUT, DO CHECKS AND SAVE DISPLAY NAME TO LOCAL STORAGE ---------------------------------------

        $("#login-modal").iziModal("close");
    }); 
    //Settings dialog
    $("#settings-dialog").iziModal({
        overlayClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.6)'
    });
    $("#settings-dialog").on('click', '.submit', function(e){
        e.preventDefault();

        //UPDATE DISPLAY NAME AND SETTINGS AND SAVE TO LOCAL STORAGE -------------------------------

        $("#settings-dialog").iziModal("close");
    });
    //Notification dialog
    $("#notifications-dialog").iziModal({
        overlayClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.2)',
        top: '10vh',
        transitionIn: 'fadeInDown'
    });
    $("#notifications-dialog").on('click', '.dismiss', function(e){
        $(this).parent('div').remove();
    });
    $("#notifications-dialog").on('click', '.accept', function(e){
        //ACCEPT THE REQUEST ----------------------------------------------------------------------

        $(this).parent('div').remove();
    });
    $("#notifications-dialog").on('click', '.reject', function(e){
        //REJECT THE REQUEST ---------------------------------------------------------------------

        $(this).parent('div').remove();
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
        var calendar = new FullCalendar.Calendar(calendarEl, {
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
            }
        });
        calendar.render();
    }
    //Listen for click on add new task
    $("#new-task").click(function(){
        $("#new-task").removeClass("new-task");
        $("#new-task").removeClass("new-task-blink");
        $("#new-task").addClass("new-task-entered");
    }); 
    //If enter key is pressed when entering a new task
    $("#new-task").on('keypress', function(e){
        if(e.which == 13){
            e.preventDefault();
            if($.trim($("#new-task").text()) != ""){
                addTask();
            }
            $("#new-task").html("");
        }
    })
    //On focus out of new task change class
    $("#new-task").focusout(function(){
        if($.trim($("#new-task").text()) != ""){
            $("#new-task").addClass("new-task-blink");
        }
        else{
            $("#new-task").html("");
            $("#new-task").removeClass("new-task-entered");
            $("#new-task").addClass("new-task");
        }
    });
    //Add task to list
    function addTask(){
        let newTask = $("#new-task").html();
        $("#todo-list").append("<li class=\"list-item\">" + newTask + "</li>")

        //ALSO ADD THE TASK TO THE WEBSERVER TO ADD TO DATABASE AND OTHER CLIENTS ---------------------------
    }
    var removeItem = [];
    //On list item click strikethrough the task
    $("#todo-list").click(function(event){
        let target = $(event.target);
        if(target.hasClass("list-item")){
            target.addClass("checked");
            
            if(target.hasClass("checked")){
                target.fadeTo(5000, 0.5);
                removeItem = setTimeout(function(){ target.remove() }, 5000);  //Mark task as complete in DB ------------
            }
        }
    });
})