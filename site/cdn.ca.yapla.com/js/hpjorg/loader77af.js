$(document).ready(function() {
	if (!$('#backgroundBox').length) {
		$(document.body).prepend("<div id='backgroundBox'><div id='loadingBox'></div></div>");
	}
});


/*
* fonction utilisée pour récupèrer la taille de la fenêtre
*
* @return jsonObject   contient la largeur et la hauteur de la fenêtre
*/
function getWindowSize() {
    var w = 0;
    var h = 0;
    
    //IE
    if (!window.innerWidth) {
        //strict mode
        if (!(document.documentElement.clientWidth == 0)) {
            w = document.documentElement.clientWidth;
            h = document.documentElement.clientHeight;
        } else {
            //quirks mode
            w = document.body.clientWidth;
            h = document.body.clientHeight;
        }
    } else {
        //w3c
        w = window.innerWidth;
        h = window.innerHeight;
    }
    
    return {width:w, height:h};
}

/*
* fonction utilisée pour récupèrer les coordonnées pour centrer un élément
*
* @param    object      windowSize, contient la largeur et la hauteur de la fenêtre
* @param    string      elementId, l'id de l'élément
* @return   jsonObject  contient les valeurs de top et left
*/
function getCenteredCoordinates(windowSize, elementId) {
    if ($('#' + elementId)) {
        var t = (windowSize.height - $('#' + elementId).height()) / 2;
        var l = (windowSize.width - $('#' + elementId).width()) / 2;
        
        t = Math.round(t);
        l = Math.round(l);
        
        return {top:t, left:l};
    }
}


/*
* fonction utilisée pour afficher le div de chargement
*
* @param    object      windowSize, contient la largeur et la hauteur de la fenêtre
* @param    object      coordinates, contient les coordonnées du div affichant l'animation
*/
function displayLoadingBox() {
    var windowSize  = getWindowSize();
    var coordinates = getCenteredCoordinates(windowSize, 'loadingBox');
    
    $('#backgroundBox').css({
        'visibility': 'visible',
        'display': 'block',
        'width': windowSize.width + 'px',
        'height': windowSize.height + 'px'
    });

    $('#loadingBox').css({
        'visibility': 'visible',
        'display': 'block',
        'top': coordinates.top + 'px',
        'left': coordinates.left + 'px'
    });
}
/*
* fonction utilisée pour cacher le div de chargement
*
*/
function hideLoadingBox() {
    $('#backgroundBox').css({
        'visibility': 'hidden',
        'display': 'none',
        'width': '0px',
        'height': '0px'
    });
}