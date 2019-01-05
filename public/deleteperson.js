function deletePerson(product_id){
    $.ajax({
        url: '/delete/' + product_id,
        type: 'DELETE',
        success: function(result){
	    console.log("reload");
            window.location.reload(true);
        }
    })
};
