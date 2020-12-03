import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import {evaluate} from 'mathjs';

const graphCanvas = document.getElementById("graphCanvas");
const graphContext = graphCanvas.getContext("2d");
const gameCanvas = document.getElementById("gameCanvas")
const gameContext = gameCanvas.getContext("2d");
let graphCanvasHeight;
let graphCanvasWidth;
let gameCanvasHeight;
let gameCanvasWidth;
//#region Graph Actions
  let graphObject = { // main object, with all graphCanvas manipulation methods
   
    Setup: function(){
      
      this.upperLimitX = graphCanvasWidth/2;
      this.lowerLimitX =-graphCanvasWidth/2;
      this.upperLimitY = graphCanvasHeight/2;
      this.lowerLimitY =-graphCanvasHeight/2;
      graphContext.setTransform(1, 0, 0, -1, graphCanvasWidth/2,graphCanvasHeight/2); // inverts y-axis in order to increase as you move further up as in the cartesian plane
      
      this.numGrids = 10; // number of grid markings
      this.pointInterval = 2; // changes for balance of smoothness of line with time to compute, increase with more zoom decrease with less zoom
      this.expression = null;
      this.fontSize = 10;
      

     this.dragCoords = {
        x: 0,
        y: 0
      }
      this.dragging = false;

      graphCanvas.addEventListener("mousedown", function(event){
        
       this.dragging = true;
        this.dragCoords ={
          x: event.clientX,
          y: event.clientY
        }
        })
      graphCanvas.addEventListener("mousemove", function(event){
        if(this.dragging === true){
          graphObject.ShiftGraph(event.clientX- this.dragCoords.x ,this.dragCoords.y - event.clientY); 

        }
        this.dragCoords ={
          x: event.clientX,
          y: event.clientY
        }
       
        })
      graphCanvas.addEventListener("mouseup", function(){
        this.dragging = false;
        
      })

      graphCanvas.addEventListener("mouseout", function(){
        this.dragging = false;
     
      
      })
      graphCanvas.addEventListener("wheel", function(event){
        if (event.deltaY < 0) {
          // Zoom out
          
          graphObject.Scale(0.9);
        }
        else {
          // Zoom in
          graphObject.Scale(1.1);
        }
        
      })
      
    },

  
    calculate : function(input){
      
      const scope = {
        x: input
      }
      if(this.expression.length > 0){
          return evaluate(this.expression,scope);
        
      }
      
    }
    ,
    ExpressionValidifier(){ // checks expression before making calculations to avoid wasting resources
      try {
        evaluate(this.expression,{x: 1});
        return true;
      } catch (error) {
        console.log("not a valid graph")
        return false;
      }
    },
    GraphCalculator: function() { // everything to do with drawing on the graphCanvas
     if(this.ExpressionValidifier() === true){
      this.Clear();
      
     this.DrawAxes();
      
     graphContext.beginPath(); // graph
     graphContext.moveTo(this.lowerLimitX,this.calculate(this.lowerLimitX));
      
     for(let i = this.lowerLimitX ; i < this.upperLimitX ; i+= this.pointInterval){
       const value = this.calculate(i);
       if(value < this.upperLimitY && value > this.lowerLimitY){
        graphContext.lineTo(i,value);
       }
         
      }
      graphContext.stroke();
    }
     }
     ,
    
    Scale: function(ratio){ 
      
      this.fontSize*=ratio;
      graphContext.scale(1/ratio,1/ratio);
      this.lowerLimitX*=ratio;
      this.upperLimitX*=ratio;
      this.lowerLimitY*=ratio;
      this.upperLimitY*=ratio;
      this.pointInterval *=ratio;
      this.GraphCalculator();
      
    },
    Clear: function(){
      graphContext.save();
      graphContext.setTransform(1,0,0,1,0,0);
      graphContext.clearRect(0,0,graphCanvasWidth,graphCanvasHeight);
      graphContext.restore();
  
      
      
      
    },
    DrawAxes : function(){

      graphContext.beginPath(); // axes
      graphContext.moveTo(this.lowerLimitX,0);
      graphContext.lineTo(this.upperLimitX,0);

      graphContext.moveTo(0,this.upperLimitY);
      graphContext.lineTo(0,this.lowerLimitY);
      graphContext.stroke();

      graphContext.save();
      graphContext.scale(1,-1);

      const roundedlowerLimitX = Math.floor(this.lowerLimitX/100)*100; // numbering
      const roundedupperLimitX = Math.ceil(this.upperLimitX/100)*100;
     
      for(let x = roundedlowerLimitX ; x < roundedupperLimitX; x+=(roundedupperLimitX-roundedlowerLimitX)/this.numGrids){ // numbering
        graphContext.font= this.fontSize+'px sans-serif';
        
        graphContext.fillText(x, x, -1);
        
      }
  
      const roundedlowerLimitY = Math.floor(this.lowerLimitY/100)*100; // numbering
      const roundedupperLimitY = Math.ceil(this.upperLimitY/100)*100;
      console.log(this.lowerLimitY);
      
      for(let y = roundedlowerLimitY ; y < roundedupperLimitY; y+=(roundedupperLimitY-roundedlowerLimitY)/this.numGrids){ // numbering
        graphContext.font= this.fontSize+'px sans-serif';
        
        graphContext.fillText(y, 1, -y);
        
      }
      
      graphContext.restore();
      

    },
    ShiftGraph: function(shiftByX,shiftByY){ 


      graphContext.transform(1, 0, 0, 1, shiftByX, shiftByY);
      this.upperLimitX-=shiftByX;
      this.lowerLimitX-=shiftByX;
      this.upperLimitY-=shiftByY;
      this.lowerLimitY-=shiftByY;
      this.GraphCalculator();
      

    },
    
    
  }
  

//#endregion
 
//#region Game Loop
let gameObjects = [];
let secondsPassed = 0;
let oldTimeStamp = 0;

function start(){
  // graph canvas size initialization
  graphCanvas.width = window.innerWidth;
  graphCanvas.height = window.innerHeight;
  graphCanvasHeight = graphCanvas.height;
  graphCanvasWidth = graphCanvas.width;

  //game canvas size initialization
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  gameCanvasHeight = gameCanvas.height;
  gameCanvasWidth = gameCanvas.width;
  graphObject.Setup();
  window.requestAnimationFrame(gameLoop);
}
// gameloop

function gameLoop(timeStamp){
  secondsPassed = (timeStamp-oldTimeStamp) /1000;
  oldTimeStamp = timeStamp;
  
  // Move forward in time with a maximum amount of 0.1s
  secondsPassed = Math.min(secondsPassed, 0.1);

  fixedUpdate(secondsPassed);

  collisionDetection();

  draw();

  window.requestAnimationFrame(gameLoop);
}

function fixedUpdate(secondsPassed){

    // moves objects according to their velocities
    gameObjects.forEach(obj => {
      obj.update(secondsPassed);
    });
  

}

function collisionDetection(){ // checks if any gameobjects are colliding
  
  let obj1;
  let obj2;

  // reset isColliding
  for (let i = 0; i < gameObjects.length; i++) {
    gameObjects[i].isColliding = false;
  }

  // looking for collisions
  for(let i = 0; i < gameObjects.length; i++){

    obj1 = gameObjects[i];
    for(let j = i + 1; j < gameObjects.length; j++){ // j will skip all previously checked collisions

      obj2 = gameObjects[j];

      //comparing obj1 with obj2
      if(rectIntersect(obj1.x,obj1.y,obj1.width,obj1.height,obj2.x,obj2.y,obj2.width,obj2.height)){
        obj1.isColliding = true;
        obj2.isColliding = true;
        console.log(obj1.width);
        console.log(obj2.width);
        
      }

    }
  
  }

}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2){ // checks if rectangles are overlapping - must be updated for rotation
  if(x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2){  
    return false;
  }
 
  return true;
}

function draw(){  // redraws each object

  gameContext.clearRect(0, 0, gameCanvasWidth, gameCanvasHeight);
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
      this.isColliding = false;
  }

}
class Car extends Gameobject {

  constructor(context,x,y,vx,vy,width,height){
    super(context,x,y,vx,vy)
    this.width = width;
    this.height = height;
  }
  

  draw(){
    this.context.fillStyle = this.isColliding?'#ff8080':'#0099b0';
      this.context.fillRect(this.x, this.y, this.width, this.height);
  }

  update(secondsPassed){
    this.x += (this.vx * secondsPassed);
    this.y += (this.vy * secondsPassed);
  }
}


//#endregion
//#region Levels

function testingLevel(){
  gameObjects = [
    new Car(gameContext,200,50,-50,0,50,50),
    new Car(gameContext,50,50,0,0,100,50)
  ]
}

//#endregion
//#region React components
  class GraphAction extends React.Component{ // any button 
    
    render(){
      
        switch(this.props.method){

       
          case "Evaluate":
            return  <button onClick={() => graphObject.GraphCalculator()} >Evaluate</button>
  
          case "Clear":
            return  <button onClick={() => graphObject.Clear()} >Clear</button>
       
          default:
            return null;
        }
       }
      
    

  }

  class Input extends React.Component{ // where we type in the function
   
    handleChange(e){
     graphObject.expression = e.target.value;
     graphObject.GraphCalculator();
    }

    render(){
      return(
        <div>
          <input onChange={this.handleChange.bind(this)} type="text" >
          </input>
        </div>
        

      )
    }

  }
  class App extends React.Component{ // main component that is rendered

    render(){
      return (
        <div>
          <div>
            <Input/>
          </div>
          <div>
             <GraphAction method ="Evaluate"/>
            
             <GraphAction method ="Clear"/>
           
          </div>
    
        </div>
      )
    }
  }

ReactDOM.render(<App />,document.getElementById("evaluate"));
//#endregion
window.onload = start();
testingLevel();