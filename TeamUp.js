$(function(){
    //Start the time
    showTimeAndDate();

    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek'
    });
    calendar.render();

    // var calendarEl = document.getElementById('calendar');
    // var calendar = new FullCalendar.Calendar(calendarEl, {
    //     initialView: 'timeGridWeek'
    // });
    // calendar.render();

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
        let weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        let month = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

        let date = weekday[newDate.getDay() - 1] + " ";
        date += newDate.getDate() + getOrdinal(newDate.getDate()) + " ";
        date += month[newDate.getMonth()] + " ";
        date += newDate.getFullYear();

        return date;
    }
    function getOrdinal(date){
        if(date > 3 && date < 21) return "th";
        switch (d % 10){
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }
})