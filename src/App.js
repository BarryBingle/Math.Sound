import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import {evaluate} from 'mathjs';

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
let canvasHeight;
let canvasWidth;
//#region Graph Actions
  let graphObject = { // main object, with all canvas manipulation methods
   
    Setup: function(){
      
      this.upperLimitX = canvasWidth/2;
      this.lowerLimitX =-canvasWidth/2;
      this.upperLimitY = canvasHeight/2;
      this.lowerLimitY =-canvasHeight/2;
      context.setTransform(1, 0, 0, -1, canvasWidth/2,canvasHeight/2); // inverts y-axis in order to increase as you move further up as in the cartesian plane
      
      this.numGrids = 10; // number of grid markings
      this.pointInterval = 2; // changes for balance of smoothness of line with time to compute, increase with more zoom decrease with less zoom
      this.expression = null;
      this.fontSize = 10;
      

     this.dragCoords = {
        x: 0,
        y: 0
      }
      this.dragging = false;

      canvas.addEventListener("mousedown", function(event){
        
       this.dragging = true;
        this.dragCoords ={
          x: event.clientX,
          y: event.clientY
        }
        })
      canvas.addEventListener("mousemove", function(event){
        if(this.dragging === true){
          graphObject.ShiftGraph(event.clientX- this.dragCoords.x ,this.dragCoords.y - event.clientY); 

        }
        this.dragCoords ={
          x: event.clientX,
          y: event.clientY
        }
       
        })
      canvas.addEventListener("mouseup", function(){
        this.dragging = false;
        
      })

      canvas.addEventListener("mouseout", function(){
        this.dragging = false;
     
      
      })
      canvas.addEventListener("wheel", function(event){
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
    GraphCalculator: function() { // everything to do with drawing on the canvas
     if(this.ExpressionValidifier() === true){
      this.Clear();
      
     this.DrawAxes();
      
     context.beginPath(); // graph
     context.moveTo(this.lowerLimitX,this.calculate(this.lowerLimitX));
      
     for(let i = this.lowerLimitX ; i < this.upperLimitX ; i+= this.pointInterval){
       const value = this.calculate(i);
       if(value < this.upperLimitY && value > this.lowerLimitY){
        context.lineTo(i,value);
       }
         
      }
      context.stroke();
    }
     }
     ,
    
    Scale: function(ratio){ 
      
      this.fontSize*=ratio;
      context.scale(1/ratio,1/ratio);
      this.lowerLimitX*=ratio;
      this.upperLimitX*=ratio;
      this.lowerLimitY*=ratio;
      this.upperLimitY*=ratio;
      this.pointInterval *=ratio;
      this.GraphCalculator();
      
    },
    Clear: function(){
      context.save();
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0,0,canvasWidth,canvasHeight);
      context.restore();
  
      
      
      
    },
    DrawAxes : function(){

      context.beginPath(); // axes
      context.moveTo(this.lowerLimitX,0);
      context.lineTo(this.upperLimitX,0);

      context.moveTo(0,this.upperLimitY);
      context.lineTo(0,this.lowerLimitY);
      context.stroke();

      context.save();
      context.scale(1,-1);

      const roundedlowerLimitX = Math.floor(this.lowerLimitX/100)*100; // numbering
      const roundedupperLimitX = Math.ceil(this.upperLimitX/100)*100;
     
      for(let x = roundedlowerLimitX ; x < roundedupperLimitX; x+=(roundedupperLimitX-roundedlowerLimitX)/this.numGrids){ // numbering
        context.font= this.fontSize+'px sans-serif';
        
        context.fillText(x, x, -1);
        
      }
  
      const roundedlowerLimitY = Math.floor(this.lowerLimitY/100)*100; // numbering
      const roundedupperLimitY = Math.ceil(this.upperLimitY/100)*100;
      console.log(this.lowerLimitY);
      
      for(let y = roundedlowerLimitY ; y < roundedupperLimitY; y+=(roundedupperLimitY-roundedlowerLimitY)/this.numGrids){ // numbering
        context.font= this.fontSize+'px sans-serif';
        
        context.fillText(y, 1, -y);
        
      }
      
      context.restore();
      

    },
    ShiftGraph: function(shiftByX,shiftByY){ 


      context.transform(1, 0, 0, 1, shiftByX, shiftByY);
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
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvasHeight = canvas.height
  canvasWidth = canvas.width
  graphObject.Setup();
  window.requestAnimationFrame(gameLoop);
}
// gameloop

function gameLoop(timeStamp){
  secondsPassed = (timeStamp-oldTimeStamp) /1000;
  oldTimeStamp = timeStamp;
  
  // gravity
  gameObjects.forEach(obj => {
    obj.y +=1;
});

  // draws each object
  gameObjects.forEach(obj => {
    obj.draw();
});
  
  window.requestAnimationFrame(gameLoop);
}





class Gameobject {
  constructor(context,x,y,vx,vy){
      context = context;
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.isColliding = false;
  }

}
class Car extends Gameobject {

  constructor(context,x,y,vx,vy){
      super(context,x,y,vx,vy);
  }
  draw(){
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      
      context.fillRect(this.x, this.y, 500, 500);
  }
  update(){
    this.y += 1 * secondsPassed;
  }
}
new Car();

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