import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import {evaluate} from 'mathjs';
//#region Setup
const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const canvasWrapper = document.getElementById("canvasWrapper").getBoundingClientRect();
canvas.height = canvasWrapper.height; // responsive changes to size of screen
canvas.width = canvasWrapper.width;
context.setTransform(1, 0, 0, -1, canvas.width/2,canvas.height/2); // inverts y-axis in order to increase as you move further up as in the cartesian plane

//#endregion
//#region Graph Actions
  let graphObject = { // main object, with all canvas manipulation methods
    upperLimitX : canvas.width/2,
    lowerLimitX :-canvas.width/2,
    upperLimitY : canvas.height/2,
    lowerLimitY :-canvas.height/2,
    numGrids: 10, // number of grid markings

    pointInterval: 0.1, // changes for balance of smoothness of line with time to compute, increase with more zoom decrease with less zoom
    expression : null,
    fontSize: 10,
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
          context.lineTo(i,this.calculate(i));
      }
      context.stroke();
    }
     }
     ,
    
    ScaleUp: function(){ 
      
      this.fontSize*=0.5;
      context.scale(2,2);
      changeScale(2);
      this.lowerLimitX*=0.5;
      this.upperLimitX*=0.5;
      this.pointInterval *=0.5;
      this.GraphCalculator();
      
    },
    ScaleDown: function(){
      
      this.fontSize*=2;
      context.scale(0.5, 0.5);
      changeScale(0.5);
      this.lowerLimitX*=2;
      this.upperLimitX*=2;
      this.pointInterval *=2;
      this.GraphCalculator();
      
      
    },
    Clear: function(){
      context.save();
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0,0,context.canvas.width,context.canvas.height);
      context.restore();
      //context.scale(1, -1);
     // context.fillText("5", 5, 0);
     // context.restore();
      
      
      
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

      const roundedlowerLimitX = Math.floor(this.lowerLimitX/100)*100;
      const roundedupperLimitX = Math.ceil(this.upperLimitX/100)*100;
      console.log(this.lowerLimitX);
      console.log(roundedlowerLimitX);

      for(let x = roundedlowerLimitX ; x < roundedupperLimitX; x+=(roundedupperLimitX-roundedlowerLimitX)/this.numGrids){ // numbering
        context.font= this.fontSize+'px sans-serif';
        
        context.fillText(x, x, -1);
        
      }
    
      context.restore();
      

    },
    ShiftGraph: function(shiftBy){ // + moves left - moves right
      context.transform(1, 0, 0, 1, shiftBy, 0);
      this.upperLimitX-=shiftBy;
      this.lowerLimitX-=shiftBy;
      this.GraphCalculator();
      

    }
    
  }
//#endregion
 
//#region React components
  class GraphAction extends React.Component{ // any button 
    
    render(){
      
        switch(this.props.method){

          case "ScaleUp":
           return <button onClick={() => graphObject.ScaleUp()} >Scale Up!</button>
          
          case "ScaleDown":
            return  <button onClick={() => graphObject.ScaleDown()} >Scale Down!</button>
          
          case "Evaluate":
            return  <button onClick={() => graphObject.GraphCalculator()} >Evaluate</button>
  
          case "Clear":
            return  <button onClick={() => graphObject.Clear()} >Clear</button>
          case "ShiftL":
          return  <button onClick={() => graphObject.ShiftGraph(20)} >Shift Left</button>
          case "ShiftR":
          return  <button onClick={() => graphObject.ShiftGraph(-20)} >Shift Right</button>
          
          default:
            return null;
        }
       }
      
    

  }


  class GraphScale extends React.Component{ // scale indicator
      constructor(props){
        super(props);
        this.state = {
            Scale: 100
        }
        changeScale = changeScale.bind(this);
        
      }
      
      render(){
        
      return <h1>{this.state.Scale}%</h1>

      }

  }
  function changeScale(ratio){ // changes state of scale value to update scale indicator
    let previousScale = this.state.Scale;
    this.setState({Scale: previousScale *ratio})
    
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
             <GraphAction method ="ScaleUp"/>
             <GraphAction method ="ScaleDown"/>
             <GraphAction method ="Clear"/>
             <GraphAction method ="ShiftL"/>
             <GraphAction method ="ShiftR"/>
          </div>
         <div>
           <GraphScale />
         </div>
        </div>
      )
    }
  }

ReactDOM.render(<App />,document.getElementById("evaluate"));
//#endregion