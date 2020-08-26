import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import {evaluate, compareText} from 'mathjs';
const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const canvasWrapper = document.getElementById("canvasWrapper").getBoundingClientRect();

canvas.height = canvasWrapper.height; // responsive changes to size of screen
canvas.width = canvasWrapper.width;




context.setTransform(1, 0, 0, -1, canvas.width/2,canvas.height/2); // inverts y-axis in order to increase as you move further up as in the cartesian plane


  let graphObject = { // main object, with all canvas manipulation methods
    upperLimit : canvas.width/2,
    lowerLimit :-canvas.width/2,
    pointInterval: 0.1, // changes for balance of smoothness of line with time to compute, increase with more zoom decrease with less zoom
    expression : null,
    calculate : function(input){
      const expr = "" + this.expression;
      const scope = {
        x: input
      }
      if(expr.length > 0){
        return evaluate(expr,scope);
      }
      
    }
    ,
    GraphCalculator: function() { // draws graph
     
      this.Clear();
      context.beginPath();
      context.moveTo(this.lowerLimit,this.calculate(this.lowerLimit));
      
     for(let i = this.lowerLimit ; i < this.upperLimit ; i+= this.pointInterval){
          context.lineTo(i,this.calculate(i));
      }
      context.stroke();
    },
    
    ScaleUp: function(){ 
      
      
      context.scale(2,2);
      changeScale(2);
      this.lowerLimit*=0.5;
      this.upperLimit*=0.5;
      this.pointInterval *=0.5;
      this.GraphCalculator();
      
    },
    ScaleDown: function(){
      
      
      context.scale(0.5, 0.5);
      changeScale(0.5);
      this.lowerLimit*=2;
      this.upperLimit*=2;
      this.pointInterval *=2;
      this.GraphCalculator();
      
      
    },
    Clear: function(){
      context.save();
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0,0,context.canvas.width,context.canvas.height);
      context.restore();
    }
    
  }

 
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
    console.log(this.state.Scale)
  }


  class Input extends React.Component{ // where we type in the function
   
    handleChange(e){
     graphObject.expression = e.target.value
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

          </div>
         <div>
           <GraphScale />
         </div>
        </div>
      )
    }
  }

ReactDOM.render(<App />,document.getElementById("evaluate"));
