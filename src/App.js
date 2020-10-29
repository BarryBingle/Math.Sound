import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import {evaluate} from 'mathjs';
//#region Setup




//#endregion
//#region Graph Actions
  let graphObject = { // main object, with all canvas manipulation methods
    canvas: document.getElementById("game"),
   
    Setup: function(){
      this.context = graphObject.canvas.getContext("2d")
      this.canvasWrapper = document.getElementById("canvasWrapper").getBoundingClientRect();
      this.canvas.height = this.canvasWrapper.height;
      this.canvas.width = this.canvasWrapper.width;
      this.upperLimitX = this.canvas.width/2;
      this.lowerLimitX =-this.canvas.width/2;
      this.upperLimitY = this.canvas.height/2;
      this.lowerLimitY =-this.canvas.height/2;
      this.context.setTransform(1, 0, 0, -1, this.canvas.width/2,this.canvas.height/2); // inverts y-axis in order to increase as you move further up as in the cartesian plane
      
      this.numGrids = 10; // number of grid markings
      this.pointInterval = 1; // changes for balance of smoothness of line with time to compute, increase with more zoom decrease with less zoom
      this.expression = null;
      this.fontSize = 10;


     this.dragCoords = {
        x: 0,
        y: 0
      }
      this.dragging = false;

      this.canvas.addEventListener("mousedown", function(event){
        
       this.dragging = true;
        this.dragCoords ={
          x: event.clientX,
          y: event.clientY
        }
        })
      this.canvas.addEventListener("mousemove", function(event){
        if(this.dragging === true){
          graphObject.ShiftGraph(event.clientX- this.dragCoords.x ,this.dragCoords.y - event.clientY); 

        }
        this.dragCoords ={
          x: event.clientX,
          y: event.clientY
        }
       
        })
      this.canvas.addEventListener("mouseup", function(){
        this.dragging = false;
        
      })

      this.canvas.addEventListener("mouseout", function(){
        this.dragging = false;
     
      
      })
      this.canvas.addEventListener("wheel", function(event){
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
      
     this.context.beginPath(); // graph
     this.context.moveTo(this.lowerLimitX,this.calculate(this.lowerLimitX));
      
     for(let i = this.lowerLimitX ; i < this.upperLimitX ; i+= this.pointInterval){
       const value = this.calculate(i);
       if(value < this.upperLimitY && value > this.lowerLimitY){
        this.context.lineTo(i,value);
       }
         
      }
      this.context.stroke();
    }
     }
     ,
    
    Scale: function(ratio){ 
      
      this.fontSize*=ratio;
      this.context.scale(1/ratio,1/ratio);
      this.lowerLimitX*=ratio;
      this.upperLimitX*=ratio;
      this.lowerLimitY*=ratio;
      this.upperLimitY*=ratio;
      this.pointInterval *=ratio;
      this.GraphCalculator();
      
    },
    Clear: function(){
      this.context.save();
      this.context.setTransform(1,0,0,1,0,0);
      this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);
      this.context.restore();
  
      
      
      
    },
    DrawAxes : function(){

      this.context.beginPath(); // axes
      this.context.moveTo(this.lowerLimitX,0);
      this.context.lineTo(this.upperLimitX,0);

      this.context.moveTo(0,this.upperLimitY);
      this.context.lineTo(0,this.lowerLimitY);
      this.context.stroke();

      this.context.save();
      this.context.scale(1,-1);

      const roundedlowerLimitX = Math.floor(this.lowerLimitX/100)*100; // numbering
      const roundedupperLimitX = Math.ceil(this.upperLimitX/100)*100;
     
      for(let x = roundedlowerLimitX ; x < roundedupperLimitX; x+=(roundedupperLimitX-roundedlowerLimitX)/this.numGrids){ // numbering
        this.context.font= this.fontSize+'px sans-serif';
        
        this.context.fillText(x, x, -1);
        
      }
  
      const roundedlowerLimitY = Math.floor(this.lowerLimitY/100)*100; // numbering
      const roundedupperLimitY = Math.ceil(this.upperLimitY/100)*100;
      console.log(this.lowerLimitY);
      
      for(let y = roundedlowerLimitY ; y < roundedupperLimitY; y+=(roundedupperLimitY-roundedlowerLimitY)/this.numGrids){ // numbering
        this.context.font= this.fontSize+'px sans-serif';
        
        this.context.fillText(y, 1, -y);
        
      }
      
      this.context.restore();
      

    },
    ShiftGraph: function(shiftByX,shiftByY){ 


      this.context.transform(1, 0, 0, 1, shiftByX, shiftByY);
      this.upperLimitX-=shiftByX;
      this.lowerLimitX-=shiftByX;
      this.upperLimitY-=shiftByY;
      this.lowerLimitY-=shiftByY;
      this.GraphCalculator();
      

    },
    
    
  }
  window.onload = graphObject.Setup();
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
