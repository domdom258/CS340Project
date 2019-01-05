function updateItem(product_id){
    $.ajax({
        url: '/item/' + product_id,
        type: 'PUT',
        data: $('#update-item').serialize(),
        success: function(result){
            window.location.replace("/owner");
        }
    })
};
