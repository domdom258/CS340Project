
function refreshPage(){
    $.ajax({
        url: '/owner'
        type: 'GET',
        success: function(result){
            window.location.reload(true);
        }
    })
};

