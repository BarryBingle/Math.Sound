import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import {evaluate} from 'mathjs';

const graphCanvas = document.getElementById("graphCanvas");
const graphContext = graphCanvas.getContext("2d");

let graphCanvasHeight;
let graphCanvasWidth;
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
    GraphCalculator: function() { // drawing your own graphs
      this.ClearAll();
      this.DrawAxes();
      if(this.ExpressionValidifier() === true){
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
    },
     
    
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
    ClearAll: function(){
      graphContext.save();
      graphContext.setTransform(1,0,0,1,0,0);
      graphContext.clearRect(0,0,graphCanvasWidth,graphCanvasHeight);
      graphContext.restore();
    
    },
    Clear: function(){
      this.expression = "";
      this.GraphCalculator();
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
 



//#region React components

  class Input extends React.Component{ // where we type in the function and clear
   constructor(){
     super();
     this.state ={text: ""};
   }
    handleChange(e){
     this.setState({text: e.target.value});
     graphObject.expression = e.target.value;
     graphObject.GraphCalculator();
    }
    handleClear(){
      this.setState({text: ""});
      graphObject.Clear();
    }

    render(){
      return(
        <div>
          <div>
            <input onChange={this.handleChange.bind(this)} type="text" value= {this.state.text}>
            </input>
          </div>
          <div>
            <button onClick={this.handleClear.bind(this)}>Clear</button>
          </div>
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
        </div>
      )
    }
  }

ReactDOM.render(<App />,document.getElementById("evaluate"));
//#endregion
function start(){
  // graph canvas size initialization
  graphCanvas.width = window.innerWidth * 0.8;
  graphCanvas.height = window.innerHeight * 0.8;
  graphCanvasHeight = graphCanvas.height;
  graphCanvasWidth = graphCanvas.width;

  graphObject.Setup();
  
  graphObject.DrawAxes();
 
}


window.onload = start();
