			
			
//AUTOCOMPLETION RECHERCHE ARTISTE
$('#artistInput').autocomplete({
	source : function(requete, reponse){ // les deux arguments représentent les données nécessaires au plugin
		var artistName=$('#artistInput').val();
		var urlX = 'http://ws.audioscrobbler.com/2.0/?method=artist.search&format=json';				
		$.ajax({
			url : urlX, // on appelle le script JSON
			dataType : 'json', // on spécifie bien que le type de données est en JSON					
			data : {
				artist : artistName,
				api_key : '9e67d33d183909be617217ecbecade37',
				limit : '10'
			},
			success : function(donnee){
			
				if ( typeof donnee.results.artistmatches == 'string'){
					reponse([]);
				}
				else{
					var artistData=donnee.results.artistmatches.artist;
					//if array of results, filter irrelevant ones .
					if($.isArray(artistData)){
						artistData.filter(function(object){
							return (typeof object.listeners != 'undefined');
						});
					}
					else{
						artistData = [artistData];
					}

					reponse($.map(artistData, function(objet){
							var obj={ 
								name: objet.name,
								image: objet.image[0]["#text"],
								value: objet.name
							};
							return obj;
					}));  
				}
			}
		});
	},
	select: function (event, ui) {
		artistExist();//maj de l'artiste dans la combo
		
		selectArtist(ui.item.value);//rechercher activement l'artiste comme si on avait appuyé sur le bouton
	}
})
.autocomplete( "instance" )._renderItem = function( ul, item ) {
	return $( "<li>" )
		.append('<img src="'+ item.image+'">')
		.append(item.name)
		.appendTo( ul );
} ;

//on déclenche la recherche sur l'appui sur enter aussi
$('#artistInput').keypress(function (e) {
 var key = e.which;
 if(key == 13)  // the enter key code
  {
	$('#artistInput').autocomplete("close");
	artistExist();//maj de l'artiste dans la combo
	selectDefaultArtist();//rechercher activement l'artiste comme si on avait appuyé sur le bouton
  }
});  			

/*
 * FONCTIONS
 */

//Vérification qu'un utilisateur existe
var userExistRequest=null;
function userExist(){
	
	//if a request was ongoing, abort it
	if(userExistRequest){
		userExistRequest.abort();
	}
	
	var userName=$('#userInput').val();
	var urlX='http://ws.audioscrobbler.com/2.0/?method=user.getinfo&format=json';
	
	
	
	//au début de toute maj d'user on enléve les résultat
	displayElement($('#searchResults'), false);
	$('#artistInput').val("");
	$('#artistSection fieldset').attr('disabled','');
	setCssError($('#artistInputCont'));
	
	userExistRequest=$.ajax({
		url : urlX, // on appelle le script JSON
		dataType : 'json', // on spécifie bien que le type de données est en JSON
		data : {
			user : userName,
			api_key : '9e67d33d183909be617217ecbecade37'
		},
	
		success : function(donnee){
			if (typeof donnee.error == 'undefined'){
				setCssSuccess($('#userInputCont'));
				
				//si utilisateur OK on active le choix d'artiste
				$('#artistSection fieldset').removeAttr('disabled');
			}
			else{
				$('#artistSection fieldset').attr('disabled','');
				setCssError($('#userInputCont'));
			}
		}
	});
}



//Validation existence artiste
var artistExistRequest =null;
function artistExist(){
		
		//if aa request was ongoing, abort it
		if(artistExistRequest){
			artistExistRequest.abort();
		}
	
		hideAllResultsElement();
		var artistName=$('#artistInput').val();
		var urlX = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&format=json';

		//au début de toute maj d'artiste on enléve les résultat
		displayElement($('#searchResults'), false);
		
		artistExistRequest=$.ajax({
			url : urlX, // on appelle le script JSON
			dataType : 'json', // on spécifie bien que le type de données est en JSON					
			data : {
				artist : artistName,
				api_key : '9e67d33d183909be617217ecbecade37'
			},
			success : function(donnee){
				artistValid=typeof donnee.error == 'undefined'
				if (artistValid){
					setCssSuccess($('#artistInputCont'));
					setSearchButtonEnabled(true);
				}
				else{
					setCssError($('#artistInputCont'));
					
					//en cas d'élément KO on cache toute forme de résultat et on rend inactif le bouton
					setSearchButtonEnabled(false);
				}
			}
		});
}

function setCssSuccess(divContainer)
{
	divContainer.removeClass( "has-error" ).addClass("has-success has-feedback");
	divContainer.find( ".glyphicon" ).removeClass( "glyphicon-remove" ).addClass("glyphicon-ok");
}
function setCssError(divContainer)
{
	divContainer.removeClass( "has-success" ).addClass("has-error has-feedback");
	divContainer.find( ".glyphicon" ).removeClass( "glyphicon-ok" ).addClass("glyphicon-remove");
}

function setSearchButtonEnabled(isEnabled){
	if(isEnabled){
		$('#searchButton').removeClass( "disabled" );
	}
	else{
		$('#searchButton').addClass( "disabled" );
	}
}

//SELECTION DE L'ARTISTE. AFFICHAGE DE LA LISTE RESULTAT


function selectDefaultArtist(){
	selectArtist($('#artistInput').val());
}

function selectArtist(artistName){					
	//Recupération track de l'artiste existant
	var urlX = 'http://ws.audioscrobbler.com/2.0/?method=user.getartisttracks&format=json';
	var userName = $('#userInput').val();
	
	//en attendant la requéte ajax on se met en waiting et on cache tout résultats autre que le titre
	displayElement($('#resultsTable'), false);
	displayElement($('#noResultsMessage'), false);
	displayElement($('#searchResults'), true);
	displayElement($('#waitingResults'), true);
	
	
	$.ajax({
			url : urlX, // on appelle le script JSON
			dataType : 'json', // on spécifie bien que le type de données est en JSON					
			data : {
				artist : artistName,
				user : userName,
				api_key : '9e67d33d183909be617217ecbecade37'
			},
			success : function(donnee){
				displayElement($('#waitingResults'), false);
				
				//cas pas d'écoute de l'artiste
				if (typeof donnee.artisttracks == 'undefined'){
					//on cache l'élément d'attente et on affiche qu'il n'y a pas de resultat
					displayElement($('#waitingResults'), false);
					displayElement($('#noResultsMessage'), true);
				}
				//cas artiste déjé écouté
				// else if(parseInt(donnee.artisttracks["@attr"].items)>=0){
				else if(parseInt(donnee.artisttracks.track.length)>=0){
					//si on a plus d'une réponse
					if(parseInt(donnee.artisttracks.track.length)>1){
					//pour chaque element 'tracks'
						$.each(donnee.artisttracks.track, function(index, value) {
							addTrInResulTable(value);
						});
					}
					//sinon on a qu'une seule valeur
					else{
						addTrInResulTable(donnee.artisttracks.track);
					}
					//on cache l'élément d'attente et on affiche les resultat
					displayElement($('#waitingResults'), false);
					displayElement($('#resultsTable'), true);
				}
			}
		});
	
}

//FONCTION INTERNE POUR CONSTRUCTION LISTE DES RESULTATS
function addTrInResulTable(value){
	$('#resultsTableBody').append(
		'<tr>'
		+'<td>'+value.name +'</td>'
		
		+'<td><img src="'+ value.image[0]["#text"]+'" alt="'+value.album["#text"]+'"></td>'
		
		+'<td>'+value.album["#text"] +'</td>'
		+'<td>'+value.date["#text"] +'</td>'
		+'</tr>'
	);
}

//cache la section de résultat ainsi que tous ses sous-elements (sauf titre)
function hideAllResultsElement(){
	$('#resultsTableBody').empty();// on vide la table de ses resultats
}

function displayElement(element,isDisplayed){
	if(isDisplayed){
		element.removeClass( "noDisplay" );
	}
	else{
		element.addClass( "noDisplay" );
	}
}


/* FUNCTION FOR DEBUG */
function getAllProperties(obj) {
  var properties = '';
  for (property in obj) {
	properties += '\n' + property + "-" +obj[property];
  }
  alert('Properties of object:' + properties);
} 


			
				

			//plus utiliser mais code interessant néamoins
 			//effectue la selection de l'artiste si l'utilisateur arréte de taper un certain temps

/* 			var timer=0;
var artistValid=false; */
// SELECTION DE L'ARTISTE APRES UN DELAY de frappe
//$('#artistInput').on("input",selectArtistOnDelay);	

/* function selectArtistOnDelay(){
	cancelTimer(timer);	
	if(artistValid){			
		timer = setTimeout(function(){
			selectArtist();$('#artistInput').autocomplete("close");
			}, 100000000000);
	}
}

//annule l'action prévu sur le timer et le met à 0
function cancelTimer(timer)
{
	if (timer!=0) {
		clearTimeout(timer);
	}
	timer =0;
}
 */
 
 //XXXXX ---------- XXXX
		
/* var display = false;
$(".the-dropdown, .menu-item").hover(function () {    
    display = true;
    setTimeout(function () {        
        if (display === true) {            
            $('.the-dropdown').show();
        }
    }, 300);
}, function () {    
    display = false;
    setTimeout(function () {
        if (display === false) {            
            $('.the-dropdown').hide();
        }
    }, 100);
}); */
			