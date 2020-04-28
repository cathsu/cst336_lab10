var deleteAuthorInfo = null; 
var deleteAuthorTokens = null;
$(".deleteAuthor").on("click", function() {
    deleteAuthorInfo = this.id;
    console.log(deleteAuthorInfo);
    deleteAuthorTokens = deleteAuthorInfo.split(' ');
    $("#confirmation").html("Are you sure you want to delete the author named " + deleteAuthorTokens.slice(0, deleteAuthorTokens.length-1).join(' ') + "? This cannot be undone.");
}); 

$("#modalDeleteButton").on("click", function() {
    let deleteAuthorID = deleteAuthorInfo.split(' ')[deleteAuthorTokens.length-1];
    console.log(deleteAuthorID);
    $.ajax({
        method: "GET",
        url: "/author/" + deleteAuthorID + "/delete",
        contentType: "application/json",
        success: function(result,status) {
            location.reload(true); //https://stackoverflow.com/questions/40286952/how-to-refresh-the-page-with-nodejs-after-click-on-submit-button
        }, 
        error: function(error, status) {
            console.log("ERROR");
            console.log(error);    
        }
    });//ajax
    
}); 

$(".quotes").on("click", function() {
    var id = $(this).attr("id");
    $.ajax({
        method: "GET",
        url: "/author/" + id + "/modal",
        contentType: "application/json",
        data: { "id": id},
        success: function(result,status) {
            var author = result[0];
            var bio = $("#bio");
            $("#authorTitle").html('<h3>' + author.firstName + ' ' +  author.lastName + '</h3>');
            bio.html(`
                    <div class="container">
                        <div class="row">
                            <div class="col-sm">
                                <img class="portrait" src= \'` + author.portrait +  `'\'> 
                            </div>
                            <div class="col-sm">
                                <div>Birth: ` +  author.dob.slice(0,10) + `</div>
                                <div>Death: ` +  author.dod.slice(0,10) + `</div>
                                <div>Sex: ` +  author.sex + `</div>
                                <div>Profession: ` +  author.profession + `</div>
                                <div>Country: ` + author.country + `</div>
                            </div>
                        </div>
                        <div class=\'bio\'>Biography: ` +  author.biography + `</div>
                    </div>
                    `); 
        }, 
        error: function(error, status) {
            console.log("ERROR");
            console.log(error);    
        }
    });//ajax
 
}); 



    