let canvas;
let context;
let gameObjects;
window.onload = start();
function start(){
    print("pemdas")
    canvas = document.getElementById("game");
    context = canvas.context;
    gameObjects = [];
    window.requestAnimationFrame(gameLoop);
}
// gameloop

function gameLoop(){
    update();
    draw();
    print("sdas");
    window.requestAnimationFrame(gameLoop);
}

function update(){
    // gravity
    gameObjects.forEach(obj => {
        obj.y +=1;
    });

}

function draw(){
    // draws each object
    gameObjects.forEach(obj => {
        obj.draw();
    });
    
}

class Gameobject {
    constructor(context,x,y,vx,vy){
        this.context = context;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.addToArray(this);
    }
    static addToArray(obj){
        gameObjects.push(obj);
    }
    

}
class Car extends Gameobject {

    constructor(context,x,y,vx,vy){
        super(context,x,y,vx,vy);
    }
    draw(){
        
        this.context.fillRect(this.x, this.y, 500, 500);
    }
}
context.fillRect(100,100,0,0);
