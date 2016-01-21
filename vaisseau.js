// This program was developped by Daniel Audet & Quentin BRODIER and uses sections of code  
// from http://math.hws.edu/eck/cs424/notes2013/19_GLSL.html
//
//  It has been adapted to be compatible with the "MV.js" library developped
//  for the book "Interactive Computer Graphics" by Edward Angel and Dave Shreiner.
//

"use strict";

// The webgl context.
var gl; 
 
// Location of the coords attribute variable in the standard texture mappping shader program.
var CoordsLoc;       
var NormalLoc;
var TexCoordLoc;

// Location of the uniform variables in the standard texture mappping shader program.
var ProjectionLoc;     
var ModelviewLoc;
var NormalMatrixLoc;

// Location of the coords attribute variable in the shader program used for texturing the environment box.
var aCoordsbox;
var aNormalbox;
var aTexCoordbox;

var uModelviewbox;
var uProjectionbox;
var uEnvbox;

var directionVaisseau = 0;
var rotationVaisseau = 0;

var theta = 0;
var thetaCube = 0;

// Projection matrix
var projection;  
// Modelview matrix 
var modelViewMatrix;
// Modelview matrix déplacement du vaisseau
var matrixSouris;
// Modelview matrix pour skybox
var matrixSkybox;
// Flattened modelview matrix    
var flattenedmodelview;   
// Matrice instance pour chaque objet 
var instanceMatrix;
// Create a 3X3 matrix that will affect normals
var normalMatrix = mat3();  


// A SimpleRotator object to enable rotation by mouse dragging.
var rotator;   

// Model identifiers
var sphere, cylinder, box, torus, cone, envbox;  
// Modèles personnalisés
var triangle, trapezeRectangle;

// Shader program identifier
var prog, progbox;  

var ct = 0;
var img = new Array(6);

// Variables pour le modèle de Phong
var lightPosition = vec4(20.0, 20.0, 100.0, 1.0);

var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
var materialDiffuse = vec4(1, 1, 1, 1.0);
var materialSpecular = vec4(1, 1, 1, 1.0);
var materialShininess = 100.0;

var ambientProduct, diffuseProduct, specularProduct;



// ------- VARIABLES STRUCTURE DE DONNEES ARBRE --------
var numNodes = 11;

// ID des éléments
var idCorps = 0;
var idCockpit = 1;
var idRotatorGauche = 2;
var idRotatorDroit = 3;
var idReacteurGauche = 4;
var idVoletGauche = 5;
var idMissileGauche = 6;
var idReacteurDroit = 7;
var idVoletDroit = 8;
var idMissileDroit = 9;
var idMoteur = 10;

var stack = [];
var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);




// Coordonnées de texture
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

// Variables de texture
var grungeTexture;
var redMetalTexture;
var greyMetalTexture;
var blackWhiteTexture;
var redWhiteTexture;
var terreTexture;
var venusTexture;
var neptuneTexture;
var soleilTexture;
var luneTexture;
var cubeSignTexture;
var skybox;


// -----------------------------------------------------
// Cette fonction charge les textures avec les paramètres

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    texture.isloaded = true;

    render();  // Call render function when the image has been loaded (to insure the model is displayed)

    gl.bindTexture(gl.TEXTURE_2D, null);
}

// -----------------------------------------------------
// Cette fonction charge les textures pour un Skybox
function handleLoadedTextureMap(texture) {

    ct++;
    if (ct == 6) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        var targets = [
           gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (var j = 0; j < 6; j++) {
            gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        texture.isloaded = true;

        render();  // Call render function when the image has been loaded (to insure the model is displayed)

        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}


// -----------------------------------------------------
// Cette fonction initialise les textures

function initTexture() {

    
    // Skybox
    var urls = [
       "skybox/nebula_posx.png", "skybox/nebula_negx.png",
       "skybox/nebula_posy.png", "skybox/nebula_negy.png",
       "skybox/nebula_posz.png", "skybox/nebula_negz.png"
    ];

    skybox = gl.createTexture();
    skybox.isloaded = false; 

    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function () { 

            handleLoadedTextureMap(skybox);
        }
        img[i].src = urls[i];   

    }
    
    // Première texture : Grunge
    grungeTexture = gl.createTexture();
    grungeTexture.isloaded = false;
    grungeTexture.image = new Image();
    grungeTexture.image.onload = function () {
        handleLoadedTexture(grungeTexture)
    }

    grungeTexture.image.src = "textures/textureGrunge.jpg";
    
    
    // Deuxième texture : Red Metal
    redMetalTexture = gl.createTexture();
    redMetalTexture.isloaded = false;
    redMetalTexture.image = new Image();
    redMetalTexture.image.onload = function () {
        handleLoadedTexture(redMetalTexture)
    }

    redMetalTexture.image.src = "textures/textureRedMetal.jpg";
    
    
    // Troisième texture : Grey Metal
    greyMetalTexture = gl.createTexture();
    greyMetalTexture.isloaded = false;
    greyMetalTexture.image = new Image();
    greyMetalTexture.image.onload = function () {
        handleLoadedTexture(greyMetalTexture)
    }

    greyMetalTexture.image.src = "textures/textureGreyMetal.jpg";

	
	// Quatrième texture : BlackWhite
    blackWhiteTexture = gl.createTexture();
    blackWhiteTexture.isloaded = false;
    blackWhiteTexture.image = new Image();
    blackWhiteTexture.image.onload = function () {
        handleLoadedTexture(blackWhiteTexture)
    }

    blackWhiteTexture.image.src = "textures/textureBlackWhite.jpg";
    
    
    // Cinquième texture : RedWhite
    redWhiteTexture = gl.createTexture();
    redWhiteTexture.isloaded = false;
    redWhiteTexture.image = new Image();
    redWhiteTexture.image.onload = function () {
        handleLoadedTexture(redWhiteTexture)
    }

    redWhiteTexture.image.src = "textures/textureRedWhite.jpg";
    
    
    // Sixième texture : Terre
    terreTexture = gl.createTexture();
    terreTexture.isloaded = false;
    terreTexture.image = new Image();
    terreTexture.image.onload = function () {
        handleLoadedTexture(terreTexture)
    }

    terreTexture.image.src = "textures/textureTerre.jpg";
    
    // Septième texture : Venus
    venusTexture = gl.createTexture();
    venusTexture.isloaded = false;
    venusTexture.image = new Image();
    venusTexture.image.onload = function () {
        handleLoadedTexture(venusTexture)
    }

    venusTexture.image.src = "textures/textureVenus.jpg";
    
    // Huitième texture : Neptune
    neptuneTexture = gl.createTexture();
    neptuneTexture.isloaded = false;
    neptuneTexture.image = new Image();
    neptuneTexture.image.onload = function () {
        handleLoadedTexture(neptuneTexture)
    }

    neptuneTexture.image.src = "textures/textureNeptune.jpg";
    
    // Neuvième texture : Soleil
    soleilTexture = gl.createTexture();
    soleilTexture.isloaded = false;  
    soleilTexture.image = new Image();
    soleilTexture.image.onload = function () {
        handleLoadedTexture(soleilTexture)
    }

    soleilTexture.image.src = "textures/textureSoleil.jpg";
    
    // Dixième texture : La lune
    luneTexture = gl.createTexture();
    luneTexture.isloaded = false;  
    luneTexture.image = new Image();
    luneTexture.image.onload = function () {
        handleLoadedTexture(luneTexture)
    }

    luneTexture.image.src = "textures/textureLune.jpg";
    
    
    // Onzième texture : Cube Signature
    cubeSignTexture = gl.createTexture();
    cubeSignTexture.isloaded = false;  
    cubeSignTexture.image = new Image();
    cubeSignTexture.image.onload = function () {
        handleLoadedTexture(cubeSignTexture)
    }

    cubeSignTexture.image.src = "textures/textureCubeSign.jpg";
    


}


// -----------------------------------------------------
// Matériaux de type Emissif 
function materiauxEmissifBlanc(){
	
	lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	lightDiffuse = vec4(0.0, 0.0, 0.0, 0.0);
	lightSpecular = vec4(0.0, 0.0, 0.0, 0.0);
    
    materialAmbient = vec4(1, 1, 1, 1.0);
	materialDiffuse = vec4(1, 1, 1, 1.0);
	materialSpecular = vec4(1, 1, 1, 1.0);
	materialShininess = 100.0;
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
}

// -----------------------------------------------------
// Propriété de Surface 1 : Ruby
function proprieteSurfaceRuby(){
	
	lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    
    materialAmbient = vec4(0.1745,0.01175,0.01175, 1.0);
	materialDiffuse = vec4(0.61424, 0.04136, 0.04136, 1.0);
	materialSpecular = vec4(0.727811, 0.626959, 0.626959, 1);
	materialShininess = 77;


    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
}

// -----------------------------------------------------
// Propriété de Surface 2 : Silver
function proprieteSurfaceSilver(){
	
	lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    
    materialAmbient = vec4(0.19225,0.19225,0.19225, 1.0);
	materialDiffuse = vec4(0.50754, 0.50754, 0.50754, 1.0);
	materialSpecular = vec4(0.508273, 0.508273, 0.508273, 1);
	materialShininess = 40;
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
}


// -----------------------------------------------------
// Propriété de Surface 3 : Obsidian
function proprieteSurfaceObsidian(){

	
	lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    
    materialAmbient = vec4(0.05375,0.05,0.06625, 1.0);
	materialDiffuse = vec4(0.18275, 0.17, 0.22525, 1.0);
	materialSpecular = vec4(0.332741, 0.328634, 0.346435, 1);
	materialShininess = 38.4;
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
}


// -----------------------------------------------------
// Propriété de Surface 4 : White Rubber
function proprieteSurfaceWhiteRubber(){

	
	lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    
    materialAmbient = vec4(0.05,0.05,0.05, 1.0);
	materialDiffuse = vec4(0.5, 0.5, 0.5, 1.0);
	materialSpecular = vec4(0.7, 0.7, 0.7, 1);
	materialShininess = 10;
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
}


// -----------------------------------------------------
// Propriété de Surface 5 : Chrome
function proprieteSurfaceChrome(){

	
	lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    
    materialAmbient = vec4(0.25,0.25,0.25, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0.774597, 0.774597, 0.774597, 1);
	materialShininess = 77;
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
}

// Reset les couleurs d'origine
function rezCouleurs(){
	
	lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    
    materialAmbient = vec4(0.5, 0.5, 0.5, 1.0);
	materialDiffuse = vec4(1, 1, 1, 1.0);
	materialSpecular = vec4(1, 1, 1, 1.0);
	materialShininess = 100.0;
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
}


// Evenements

document.onkeydown = function (event) {
    event = event || window.event;
    
    // Le vaisseau avance
    if (event.keyCode == 72) {
        directionVaisseau += 1;
        
    }
    // Le vaisseau recule
    if (event.keyCode == 66) {
       directionVaisseau -= 1;
    }
    // Le vaisseau tourne à gauche
    if (event.keyCode == 37) {
       rotationVaisseau -= 1;
    }
    // Le vaisseau tourne à droite
    if (event.keyCode == 39) {
       rotationVaisseau += 1;
    }
    
}



// -----------------------------------------------------
// Cette fonction permet de créer un noeud dans l'arbre

function createNode(transform, render, sibling, child){
    var node = {
	    transform: transform,
	    render: render,
	    sibling: sibling,
	    child: child,
    }
    return node;
}

// -----------------------------------------------------
// Initialise les noeuds de l'arbre
function initNodes(Id) {

    var m = mat4();
    
    switch(Id) {
    
    // CORPS DU VAISSEAU
    case idCorps:
    	
	    m = rotate(-90, 0, 1, 0 );
	    m = mult(m,rotate(-15,1,0,0));
	    m = mult(m,translate(0,0,0)); // Si on bouge le corps, tout suit !
	    figure[idCorps] = createNode( m, corps, null, idCockpit );
	    break;
	    
	// COCKPIT DU VAISSEAU
	case idCockpit:
		
		m = translate(0,0.3,-5);
		figure[idCockpit] = createNode( m, cockpit, idMoteur, null );
		break;
		
	// MOTEUR DU VAISSEAU
	case idMoteur:
		
		m = translate(0,0,-3);
		figure[idMoteur] = createNode( m, moteur, idRotatorGauche, null );
		break;
		
	// ROTATOR GAUCHE DU VAISSEAU
	case idRotatorGauche :
		
		m = translate(-4,-1,-7);
		figure[idRotatorGauche] = createNode( m, rotatorV, idRotatorDroit, idReacteurGauche );		
		break;
		
	
	// ROTATOR DROIT DU VAISSEAU	
	case idRotatorDroit :
	
		m = translate(4,-1,-7);
		m = mult(m,scale(-1,1,1));	// Permet d'effectuer la symétrie
		figure[idRotatorDroit] = createNode( m, rotatorV, null, idReacteurDroit );
		break;
		
		
	// AILE GAUCHE DU VAISSEAU
	case idReacteurGauche :
	
		m = translate(-5,0,-3);
		figure[idReacteurGauche] = createNode( m, reacteur, null, idVoletGauche );
		break;
		
	case idVoletGauche :
	
		m = translate(-5,0,0);
		figure[idVoletGauche] = createNode( m, volet, null, idMissileGauche );
		break;
		
	case idMissileGauche :
	
		m = translate(-15,0,-1);
		figure[idMissileGauche] = createNode( m, missile, null, null );
		break;

		
	// AILE DROITE DU VAISSEAU
	case idReacteurDroit :
	
		m = translate(-5,0,-3);
		figure[idReacteurDroit] = createNode( m, reacteur, null, idVoletDroit );
		break;
		
	case idVoletDroit :
	
		m = translate(-5,0,0);
		figure[idVoletDroit] = createNode( m, volet, null, idMissileDroit );
		break;
		
	case idMissileDroit :
	
		m = translate(-15,0,-1);
		figure[idMissileDroit] = createNode( m, missile, null, null );
		break;

    }

}

// -----------------------------------------------------
// Parcours l'arbre depuis un ID
function traverse(Id) {
  
   if(Id == null) return; 
   
   stack.push(modelViewMatrix);
   
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   
   figure[Id].render();
   
   if(figure[Id].child != null) traverse(figure[Id].child); 
   
   modelViewMatrix = stack.pop();
    
   if(figure[Id].sibling != null) traverse(figure[Id].sibling); 
}


// -----------------------------------------------------
// Construit le corps du vaisseau
function corps(){
    
    
	proprieteSurfaceChrome();
	
   
	// Triangle coté gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0.30, -1.48, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(85, 0, 1, 0));
    instanceMatrix = mult(instanceMatrix, rotate(90, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.6, 7.5, 1));
    triangle.render();
    
    // Triangle coté droite
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-0.1, -1.5, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(-86, 0, 1, 0));
    instanceMatrix = mult(instanceMatrix, rotate(90, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.6, -7.5, 1));
    triangle.render();
    
    // Triangle coté plongeant gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0.30, -0.65, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(85, 0, 1, 0));
    instanceMatrix = mult(instanceMatrix, rotate(86, 0, 0, 1));
    instanceMatrix = mult(instanceMatrix, rotate(-30, 0, 1, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.3, -7.4, 1));
    triangle.render();
    
    // Triangle coté plongeant droite
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-0.1, -0.7, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(-86, 0, 1, 0));
    instanceMatrix = mult(instanceMatrix, rotate(94, 0, 0, 1));
    instanceMatrix = mult(instanceMatrix, rotate(-30, 0, 1, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.3, 7.4, 1));
    triangle.render();
    
    // Triangle dessous gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2.3, 0.6, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(88, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(-1, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix); 
    instanceMatrix = mult(instanceMatrix, scale(0.6, 7.5, 1));
    triangle.render();
    
    // Triangle dessous droite
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(2.5, -4.2, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(88, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(1, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix); 
    instanceMatrix = mult(instanceMatrix, scale(-0.6, 7.5, -1));
    triangle.render();
    
    // Petite Planche du dessous
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, -2, 4));
    instanceMatrix = mult(instanceMatrix, rotate(-2.0, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.13, 0.01, 5));
    box.render();
    
    // Petite Planche du dessous 2
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(1, -1, 23));
    instanceMatrix = mult(instanceMatrix, rotate(-2, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(-6, 0, 1, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.05, 0.01, 1));
    box.render();

    // Petite Planche du dessous 3
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0.7, -1, 20));
    instanceMatrix = mult(instanceMatrix, rotate(-2, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(-2, 0, 1, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.05, 0.01, 1));
    box.render();
    
    // Moyenne Planche du dessous
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, -2.1, 0));
    instanceMatrix = mult(instanceMatrix, rotate(-2.0, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.3, 0.01, 4));
    box.render();
    
    
    // Triangle fermeture avant gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-0.95, -0.6, 28.4));
    instanceMatrix = mult(instanceMatrix, rotate(80, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix); 
    instanceMatrix = mult(instanceMatrix, scale(0.22, 0.22, 0.22));
    triangle.render();
    
    // Triangle fermeture avant droite
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0.95, -0.6, 28.4));
    instanceMatrix = mult(instanceMatrix, rotate(100, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix); 
    instanceMatrix = mult(instanceMatrix, scale(0.22, -0.22, 0.22));
    triangle.render();
    
    // Petit carré fermeture milieu
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, -0.6, 28.9));
    instanceMatrix = mult(instanceMatrix, rotate(0.0, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.1, 0.01));
    box.render();
    
    // Petit carré fermeture haut
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, -0.25, 28.9));
    instanceMatrix = mult(instanceMatrix, rotate(0.0, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.17, 0.04, 0.01));
    box.render();
     
    
    
	rezCouleurs();
    
    
    
    // -----------------------------------------------------
	// Element Texture 1 -> Grunge Gris
    gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, grungeTexture);
	gl.uniform1i(gl.getUniformLocation(prog, "texture"), 1);
	gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1);    
    
    // Planche du corps
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, 0, 4));
    instanceMatrix = mult(instanceMatrix, rotate(0.0, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.3, 0.01, 5));
    box.render();
    
    // Triangle dessus gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-1.2, -2.5, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(-90, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(184, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix); 
    instanceMatrix = mult(instanceMatrix, scale(0.6, 7.5, 1));
    triangle.render();
    
    // Triangle dessus droite
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(2.9, -2.5, 10.3));
    instanceMatrix = mult(instanceMatrix, rotate(-90, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(180, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.6, 7.5, 1));
    triangle.render();
    
    
    // -----------------------------------------------------
	// Elements sans texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0); 
    
    
       
    
    // Trapèze rectangle gauche face haut
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-3, -1.77, 20));
    instanceMatrix = mult(instanceMatrix, rotate(-90, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(180, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.6, -0.6, 0.6));
    trapezeRectangle.render();
    
    // Trapèze rectangle gauche face bas
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-3, 1.2, 20));
    instanceMatrix = mult(instanceMatrix, rotate(90, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(-0.6, -0.6, 0.6));
    trapezeRectangle.render();
    
    // Trapèze rectangle droite face haut
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(3, -1.77, 20));
    instanceMatrix = mult(instanceMatrix, rotate(-90, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.6, 0.6, 0.6));
    trapezeRectangle.render();
    
    // Trapèze rectangle droite face bas
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(3, 1.2, 20));
    instanceMatrix = mult(instanceMatrix, rotate(90, 1, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix); 
    instanceMatrix = mult(instanceMatrix, scale(0.6, -0.6, 0.6));
    trapezeRectangle.render();

	rezCouleurs();
    

}


// -----------------------------------------------------
// Construit le cockpit du vaisseau
function cockpit(){
    
    proprieteSurfaceObsidian();
    
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0,0,0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.2, 0.2, 0.8));
    sphere.render();	
    
    
    rezCouleurs();
	
}


// -----------------------------------------------------
// Construit le moteur du vaisseau
function moteur(){
    
    
    proprieteSurfaceSilver();
    
    // Cone partant du cockpit
    instanceMatrix = modelViewMatrix;
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.33, 0.33, 0.6));
    cone.render();	
    
    // Cone opposé
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0,0,-12));
    instanceMatrix = mult(instanceMatrix, rotate(180,0,1,0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.33, 0.33, 0.6));
    cone.render();
    
    
    materiauxEmissifBlanc();
    
    
    // Gros carré moteur
	instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0,-0.75,-15));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.9, 0.57, 0.8));
    box.render();
    
    
	// Carré 2 moteur
	instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0,-2.1,-5));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.91, 0.3, 1.7));
    box.render();
    
    
    proprieteSurfaceWhiteRubber();
    
    
    // "Pot d'Echappement" partie basse
	instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0,-2.9,-19));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.7, 0.02, 0.3));
    box.render();
    
    // "Pot d'Echappement" partie haute
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0,0.9,-19));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.7, 0.02, 0.3));
    box.render();
    
    // "Pot d'Echappement" partie gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(3.5,-1,-19));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.02, 0.4, 0.3));
    box.render();
    
    // "Pot d'Echappement" partie droite
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-3.5,-1,-19));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.02, 0.4, 0.3));
    box.render();
    
    rezCouleurs();
   
	
}


// -----------------------------------------------------
// Construit le rotator 
function rotatorV(){
    
    
    // -----------------------------------------------------
	// Element Texture 3 -> Grey Metal
    gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, greyMetalTexture);
	gl.uniform1i(gl.getUniformLocation(prog, "texture"), 3);
	gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1);      
    // Grand rotator gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, rotate(4, 0, 1, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.1, 12.5));
    torus.render();	
    
    // Petit rotator gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, rotate(4, 0, 1, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.05, 0.05, 12.5));
    torus.render();	
    
    // -----------------------------------------------------
	// Elements sans texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0); 
    
	
}


// -----------------------------------------------------
// Construit le reacteur du vaisseau
function reacteur(){
    
    
    materiauxEmissifBlanc();
    
    // Petit volet
    instanceMatrix = modelViewMatrix;
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.90, 0.01, 1.7));
    box.render();
    
    
    rezCouleurs();
    
    // -----------------------------------------------------
	// Element Texture 2 -> Red Metal Texture
    gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, redMetalTexture);
	gl.uniform1i(gl.getUniformLocation(prog, "texture"), 2);
	gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1);     
    
    // Reacteur cylindre troué
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2,0,6.5));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.2, 0.2, 3));
    torus.render();
    
    
    // -----------------------------------------------------
	// Elements sans texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0); 
    
    
    // Reacteur cylindre qui rempli le trou
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2,0,4.5));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.28, 0.28, 0.1));
    cylinder.render();	
    
    // Reacteur Petit cylindre intermédiaire
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2,0,2.5));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.2, 0.2, 0.1));
    cylinder.render();	
    
    
    // -----------------------------------------------------
	// Element Texture 5 -> Red White
    gl.activeTexture(gl.TEXTURE5);
	gl.bindTexture(gl.TEXTURE_2D, redWhiteTexture);
	gl.uniform1i(gl.getUniformLocation(prog, "texture"), 5);
	gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1);   	
    
    // Reacteur long cylindre
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2,0,-4));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.28, 0.28, 0.55));
    cylinder.render();	
    
	
	// -----------------------------------------------------
	// Elements sans texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0); 
   
    
    // Réacteur - Intérieur cylindre troué
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2, 1.4, 7));
    instanceMatrix = mult(instanceMatrix, rotate(90, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.3, 0.01, 0.25));
    box.render();
    
	// Réacteur - Petit rectangle sur petit cylindre 1
	instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2, 2, 2.6));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.03, 0.25));
    box.render();
    
    // Réacteur - Petit rectangle sur petit cylindre 2
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-3.5, 1.6, 2.6));
    instanceMatrix = mult(instanceMatrix, rotate(45, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.03, 0.25));
    box.render();
    
    // Réacteur - Petit rectangle sur petit cylindre 3
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-0.5, 1.6, 2.6));
    instanceMatrix = mult(instanceMatrix, rotate(-45, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.03, 0.25));
    box.render();
    
    // Réacteur - Petit rectangle sur petit cylindre 4
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2, -2, 2.6));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.03, 0.25));
    box.render();
    
    // Réacteur - Petit rectangle sur petit cylindre 5
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-0.5, -1.6, 2.6));
    instanceMatrix = mult(instanceMatrix, rotate(45, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.03, 0.25));
    box.render();
    
    // Réacteur - Petit rectangle sur petit cylindre 6
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-3.5, -1.6, 2.6));
    instanceMatrix = mult(instanceMatrix, rotate(-45, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.03, 0.25));
    box.render();
    
    // Reacteur Petit cylindre bout
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2,0,-11));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.2, 0.2, 0.15));
    cylinder.render();
    
    
    // Reacteur Moyen cylindre bout
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2,0,-12));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.24, 0.24, 0.05));
    cylinder.render();
    
    proprieteSurfaceRuby();
    
    // "Pot d'Echappement"
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-2,0,-13));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.1, 0.5));
    torus.render();
    
    rezCouleurs();
	
   
}


// -----------------------------------------------------
// Construit le volet du vaisseau
function volet(){
    
   
    // -----------------------------------------------------
	// Element Texture 1 -> Grunge Gris
    gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, grungeTexture);
	gl.uniform1i(gl.getUniformLocation(prog, "texture"), 1);
	gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1);   	
	
    // Grand volet - partie carré
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-5, 0, -1.75));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(2, 0.01, 1.35));
    box.render();
    
    // Grand volet - partie triangulaire face haut
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(-7.2, -2.45, 6.65));
    instanceMatrix = mult(instanceMatrix, rotate(-90, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(180, 0, 0, 1));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(-3.1,0.68, 1));
    triangle.render();
    
    // Grand volet - partie triangulaire face bas
    instanceMatrix = instanceMatrix;
    instanceMatrix = mult(modelViewMatrix, translate(-7.2, 2.43, 6.64));
    instanceMatrix = mult(instanceMatrix, rotate(-90, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, rotate(180, 0, 1, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(-3.1,-0.68, 1));
    triangle.render();
    
    
    // -----------------------------------------------------
	// Elements sans texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0); 
	
    
   
}


// -----------------------------------------------------
// Construit le missile du vaisseau
function missile(){
    
    
    // -----------------------------------------------------
	// Element Texture 4 -> Black
    gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, blackWhiteTexture);
	gl.uniform1i(gl.getUniformLocation(prog, "texture"), 4);
	gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1); 
	     
    // Grand Cylindre Missile Gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, 0, 0));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.1, 0.8));
    cylinder.render();
    
    // -----------------------------------------------------
	// Elements sans texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0); 
    
    // Sphère Missile Gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, 0, 8));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.1, 0.1, 0.1));
    sphere.render();
    
    // Petit Cylindre Missile Gauche
    instanceMatrix = modelViewMatrix;
    instanceMatrix = mult(instanceMatrix, translate(0, 0, 10));
    normalMatrix = extractNormalMatrix(instanceMatrix);
    instanceMatrix = mult(instanceMatrix, scale(0.03, 0.03, 0.2));
    cylinder.render();
  
}




function render() {

	theta += 0.2;
	thetaCube += 2;
	

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    projection = perspective(70.0, 1.0, 1.0, 2000.0);

    //--- Get the rotation matrix obtained by the displacement of the mouse
    //---  (note: the matrix obtained is already "flattened" by the function getViewMatrix)
    flattenedmodelview = rotator.getViewMatrix();
    modelViewMatrix = unflatten(flattenedmodelview);
	instanceMatrix = mat4();
	normalMatrix = extractNormalMatrix(modelViewMatrix);
	
	// On fait le rendu que si les textures sont chargées
	if(skybox.isloaded && grungeTexture.isloaded && redMetalTexture.isloaded && greyMetalTexture.isloaded
	 && blackWhiteTexture.isloaded && redWhiteTexture.isloaded && terreTexture.isloaded && venusTexture.isloaded
	 && neptuneTexture.isloaded && soleilTexture.isloaded && luneTexture.isloaded && cubeSignTexture.isloaded){

		//----------------------- VAISSEAU -----------------------//
		
	    //  Select shader program 
	    gl.useProgram(prog);
	
	    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	    gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	    gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
	    gl.uniform4fv(gl.getUniformLocation(prog, "lightPosition"), flatten(lightPosition));
	
	    gl.uniformMatrix4fv(ProjectionLoc, false, flatten(projection));  // send projection matrix to the new shader program
	
		gl.enableVertexAttribArray(CoordsLoc);
	    gl.enableVertexAttribArray(NormalLoc); 
	    gl.enableVertexAttribArray(TexCoordLoc);  
	
	
		// Parcours l'arbre     
	    traverse(idCorps);
	    
	    
	    
	    //----------------------- PLANETES -----------------------//
	    
		
		// Rotations et translations pour gérer le déplacement souris
		// On accumule les matrices plutôt que les angles
		matrixSouris = modelViewMatrix;
		if(directionVaisseau > 0){
			for(i=0 ; i < directionVaisseau ; i++){
				matrixSouris = mult(matrixSouris,translate(1,0,0));
			}
		}
		else{
			for(i=0 ; i > directionVaisseau ; i--){
				matrixSouris = mult(matrixSouris,translate(-1,0,0)); 
			}
		}
		if(rotationVaisseau > 0){
			for(i=0 ; i < rotationVaisseau ; i++){
				matrixSouris = mult(matrixSouris,rotate(1,0,1,0));
			}
		}
		else{
			for(i=0 ; i > rotationVaisseau ; i--){
				matrixSouris = mult(matrixSouris,rotate(-1,0,1,0)); 
			}
		}
		matrixSkybox = matrixSouris;
		
		
		
		// -----------------------------------------------------
		// Element Texture 6 -> Surface Terre
	    gl.activeTexture(gl.TEXTURE6);
		gl.bindTexture(gl.TEXTURE_2D, terreTexture);
		gl.uniform1i(gl.getUniformLocation(prog, "texture"), 6);
		gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1); 
		
	
	    instanceMatrix = matrixSouris;
	    
	    instanceMatrix = mult(instanceMatrix, translate(-300, 150, 100));
	       
	    instanceMatrix = mult(instanceMatrix, rotate(90,1,0,0));
	    instanceMatrix = mult(instanceMatrix, rotate(150,0,1,0));
	    instanceMatrix = mult(instanceMatrix, rotate(theta,1,0,0)); // Rotation de la Terre sur elle même

	    normalMatrix = extractNormalMatrix(instanceMatrix);
	    instanceMatrix = mult(instanceMatrix, scale(5, 5, 5));
	    sphere.render();
	    
	    
	    
	    // -----------------------------------------------------
		// Element Texture 7 -> Surface Venus
	    gl.activeTexture(gl.TEXTURE7);
		gl.bindTexture(gl.TEXTURE_2D, venusTexture);
		gl.uniform1i(gl.getUniformLocation(prog, "texture"), 7);
		gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1); 
		
	
	    instanceMatrix = matrixSouris;
	    
	    instanceMatrix = mult(instanceMatrix, translate(300, -200, 300));	    
	    instanceMatrix = mult(instanceMatrix, rotate(90,1,0,0));
	    instanceMatrix = mult(instanceMatrix, rotate(150,0,1,0));
	    instanceMatrix = mult(instanceMatrix, rotate(theta,1,0,0)); // Rotation de Venus sur elle même
	    normalMatrix = extractNormalMatrix(instanceMatrix);
	    instanceMatrix = mult(instanceMatrix, scale(6, 6, 6));
	    sphere.render();
	    
	    
	    // -----------------------------------------------------
		// Element Texture 8 -> Surface Neptune
	    gl.activeTexture(gl.TEXTURE8);
		gl.bindTexture(gl.TEXTURE_2D, neptuneTexture);
		gl.uniform1i(gl.getUniformLocation(prog, "texture"), 8);
		gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1); 
		
	
	    instanceMatrix = matrixSouris;
	   
	    instanceMatrix = mult(instanceMatrix, translate(400, 200, -300));	
	    instanceMatrix = mult(instanceMatrix, rotate(theta,1,0,0)); // Rotation de Neptune sur elle même
	    normalMatrix = extractNormalMatrix(instanceMatrix);
	    instanceMatrix = mult(instanceMatrix, scale(6, 6, 6));
	    sphere.render();

	    
	    
	    // -----------------------------------------------------
		// Element Texture 9 -> Surface Soleil
	    gl.activeTexture(gl.TEXTURE9);
		gl.bindTexture(gl.TEXTURE_2D, soleilTexture);
		gl.uniform1i(gl.getUniformLocation(prog, "texture"), 9);
		gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1); 
		
	
	    instanceMatrix = matrixSouris;
	   
	    instanceMatrix = mult(instanceMatrix, translate(-200, 300, -200));	
	    instanceMatrix = mult(instanceMatrix, rotate(theta,1,0,0)); // Rotation du Soleil sur lui même
	    normalMatrix = extractNormalMatrix(instanceMatrix);
	    instanceMatrix = mult(instanceMatrix, scale(6, 6, 6));
	    sphere.render();
	    
	    
	    // -----------------------------------------------------
		// Element Texture 10 -> Surface Lune
	    gl.activeTexture(gl.TEXTURE10);
		gl.bindTexture(gl.TEXTURE_2D, luneTexture);
		gl.uniform1i(gl.getUniformLocation(prog, "texture"), 10);
		gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1); 
		
	
	    instanceMatrix = matrixSouris;	    
	    
	    instanceMatrix = mult(instanceMatrix, translate(-300, 150, 100));
		instanceMatrix = mult(instanceMatrix, rotate(theta,0,1,0)); 	// Rotation autour de la terre
	    instanceMatrix = mult(instanceMatrix, translate(0, 0, -100));	// Déplace la lune de l'origne à coté de la terre
	    normalMatrix = extractNormalMatrix(instanceMatrix);
	    instanceMatrix = mult(instanceMatrix, scale(1.5, 1.5, 1.5));
	    sphere.render();
	    
	
	    // -----------------------------------------------------
		// Elements sans texture
	    gl.bindTexture(gl.TEXTURE_2D, null);
	    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0); 
	    
  

	    
	    //----------------------- SKYBOX -----------------------//
	    
	    // Draw the environment (box)
        gl.useProgram(progbox); // Select the shader program that is used for the environment box.
		
        gl.uniformMatrix4fv(uProjectionbox, false, flatten(projection));

        gl.enableVertexAttribArray(aCoordsbox);
        gl.disableVertexAttribArray(aNormalbox);     // normals are not used for the box
        gl.disableVertexAttribArray(aTexCoordbox);  // texture coordinates not used for the box

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, skybox);
        // Send texture to sampler
        gl.uniform1i(uEnvbox, 0);
        
		instanceMatrix = matrixSkybox;
		envbox.render();
		
		
		
		//----------------------- CUBE SIGNATURE -----------------------//
		
		//  Select shader program 
	    gl.useProgram(prog);
	
	    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	    gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	    gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	
	    gl.uniform4fv(gl.getUniformLocation(prog, "lightPosition"), flatten(lightPosition));
	
	    gl.uniformMatrix4fv(ProjectionLoc, false, flatten(projection));  // send projection matrix to the new shader program
	
		gl.enableVertexAttribArray(CoordsLoc);
	    gl.enableVertexAttribArray(NormalLoc);  
	    gl.enableVertexAttribArray(TexCoordLoc);  
	    
	
		// -----------------------------------------------------
		// Element Texture 11 -> Signature Cube
	    gl.activeTexture(gl.TEXTURE11);
		gl.bindTexture(gl.TEXTURE_2D, cubeSignTexture);
		gl.uniform1i(gl.getUniformLocation(prog, "texture"), 11);
		gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 1);
	
	    instanceMatrix = matrixSouris;
	    instanceMatrix = mult(instanceMatrix, translate(-100, 40, -50));
	    instanceMatrix = mult(instanceMatrix, rotate(90,0,1,0));
	    instanceMatrix = mult(instanceMatrix, rotate(thetaCube,1,0,0));
	    normalMatrix = extractNormalMatrix(instanceMatrix);
	    instanceMatrix = mult(instanceMatrix, scale(3, 3, 3));
	    box.render();
	    
	    // -----------------------------------------------------
		// Elements sans texture
	    gl.bindTexture(gl.TEXTURE_2D, null);
	    gl.uniform1i(gl.getUniformLocation(prog, "textureFlag"), 0);
		

	}
	

    	
}



function unflatten(matrix) {
    var result = mat4();
    result[0][0] = matrix[0]; result[1][0] = matrix[1]; result[2][0] = matrix[2]; result[3][0] = matrix[3];
    result[0][1] = matrix[4]; result[1][1] = matrix[5]; result[2][1] = matrix[6]; result[3][1] = matrix[7];
    result[0][2] = matrix[8]; result[1][2] = matrix[9]; result[2][2] = matrix[10]; result[3][2] = matrix[11];
    result[0][3] = matrix[12]; result[1][3] = matrix[13]; result[2][3] = matrix[14]; result[3][3] = matrix[15];

    return result;
}

function extractNormalMatrix(matrix) { // This function computes the transpose of the inverse of 
    // the upperleft part (3X3) of the modelview matrix (see http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/ )

    var result = mat3();
    var upperleft = mat3();
    var tmp = mat3();

    upperleft[0][0] = matrix[0][0];  // if no scaling is performed, one can simply use the upper left
    upperleft[1][0] = matrix[1][0];  // part (3X3) of the modelview matrix
    upperleft[2][0] = matrix[2][0];

    upperleft[0][1] = matrix[0][1];
    upperleft[1][1] = matrix[1][1];
    upperleft[2][1] = matrix[2][1];

    upperleft[0][2] = matrix[0][2];
    upperleft[1][2] = matrix[1][2];
    upperleft[2][2] = matrix[2][2];

    tmp = matrixinvert(upperleft);
    result = transpose(tmp);

    return result;
}

function matrixinvert(matrix) {

    var result = mat3();

    var det = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) -
                 matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
                 matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    var invdet = 1 / det;

    // inverse of matrix m
    result[0][0] = (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) * invdet;
    result[0][1] = (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invdet;
    result[0][2] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invdet;
    result[1][0] = (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invdet;
    result[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invdet;
    result[1][2] = (matrix[1][0] * matrix[0][2] - matrix[0][0] * matrix[1][2]) * invdet;
    result[2][0] = (matrix[1][0] * matrix[2][1] - matrix[2][0] * matrix[1][1]) * invdet;
    result[2][1] = (matrix[2][0] * matrix[0][1] - matrix[0][0] * matrix[2][1]) * invdet;
    result[2][2] = (matrix[0][0] * matrix[1][1] - matrix[1][0] * matrix[0][1]) * invdet;

    return result;
}


function createModel(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.textureBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexTextureCoords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
     
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(CoordsLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(NormalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(TexCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(ModelviewLoc, false, flatten(instanceMatrix));    //--- load flattened modelview matrix
        gl.uniformMatrix3fv(NormalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix
		
		
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        
    }
    return model;
}


function createModelbox(modelData) {  // For creating the environment box.
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoordsbox, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelviewbox, false, flatten(instanceMatrix)); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}



function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


function getTextContent(elementID) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}







window.onload = function init() {
    try {
        var canvas = document.getElementById("glcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            gl = canvas.getContext("experimental-webgl");
        }
        if (!gl) {
            throw "Could not create WebGL context.";
        }
		
        
        // ------------------------------------------------------------------
		// SHADER -> SkyBox
		
        var vertexShaderSourceBox = getTextContent("vshaderbox");
        var fragmentShaderSourceBox = getTextContent("fshaderbox");
        progbox = createProgram(gl, vertexShaderSourceBox, fragmentShaderSourceBox);

        gl.useProgram(progbox);
        
        aCoordsbox = gl.getAttribLocation(progbox, "vcoords");
        aNormalbox = gl.getAttribLocation(progbox, "vnormal");
        aTexCoordbox = gl.getAttribLocation(progbox, "vtexcoord");

        uModelviewbox = gl.getUniformLocation(progbox, "modelview");
        uProjectionbox = gl.getUniformLocation(progbox, "projection");
        uEnvbox = gl.getUniformLocation(progbox, "skybox");


		// ------------------------------------------------------------------
		// SHADER -> Standard Texture Mapping

        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");
        prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
       
        gl.useProgram(prog);

        CoordsLoc = gl.getAttribLocation(prog, "vcoords");
        NormalLoc = gl.getAttribLocation(prog, "vnormal");
        TexCoordLoc = gl.getAttribLocation(prog, "vtexcoord");
        
        ModelviewLoc = gl.getUniformLocation(prog, "modelViewMatrix");
        ProjectionLoc = gl.getUniformLocation(prog, "projection");
        NormalMatrixLoc = gl.getUniformLocation(prog, "normalMatrix");
        
        gl.enableVertexAttribArray(CoordsLoc);
        gl.enableVertexAttribArray(NormalLoc);
        gl.enableVertexAttribArray(TexCoordLoc);
        
        
        
		
        
        gl.enable(gl.DEPTH_TEST);


	    // Initialise les textures	
	    initTexture();


        //  create a "rotator" monitoring mouse mouvement
        rotator = new SimpleRotator(canvas, bidon);
        rotator.setView([1, 0, 0], [0, 1, 0],70);


        // Modèles pré-créés
		sphere = createModel(uvSphere(10.0, 25.0, 25.0));
        cylinder = createModel(uvCylinder(10.0, 20.0, 25.0, false, false));
        box = createModel(cube(10.0));
        torus = createModel(uvTorus(15.0, 13.0, 25.0, 25.0));
        cone = createModel(uvCone(10.0, 20.0, 25.0, false));
		
		// Formes personnalisées
		triangle = createModel(triangle(5));
		trapezeRectangle = createModel(trapezeRectangle(5));
		
        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);
       
        // Skybox
        envbox = createModelbox(cube(1000.0));
        
    }
    catch (e) {
        console.log("Could not initialize WebGL" + e);
        return;
    }
    
	for(i=0; i<numNodes; i++) initNodes(i);
	
    setInterval(render, 50);
}


// Permet de ne pas appeler Render lors du déplacement de la souris (rotator)
// et donc d'accéler la rotation des planètes
function bidon(){
}



