import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import {evaluate} from 'mathjs';
import ReactSlider from 'react-slider';
//#region Graph Actions

const graphCanvas = document.getElementById("graphCanvas");
const graphContext = graphCanvas.getContext("2d");

let graphCanvasHeight;
let graphCanvasWidth;



  let graphObject = { // main object, with all graphCanvas manipulation methods
   
    Setup: function(){
      this.expressionValidity = false;
      this.upperLimitX = graphCanvasWidth/2;
      this.lowerLimitX =-graphCanvasWidth/2;
      this.upperLimitY = graphCanvasHeight/2;
      this.lowerLimitY =-graphCanvasHeight/2;
     
      this.numGrids = 20; // number of grid markings
      this.pointInterval = 2; // changes for balance of smoothness of line with time to compute, increase with more zoom decrease with less zoom
      this.zoomRatio = 1; // each pixel equals one unit at the start
      this.expressions = [{expr: "",domain:[-1000,1000],colour: "#000000"},]; // array of objects that gets all info about a certain expression colour, value and domains. Initialised with empty graph
      this.fontSize = 10;
      
     
      graphContext.setTransform(1, 0, 0, -1, graphCanvasWidth/2,graphCanvasHeight/2); // inverts y-axis in order to increase as you move further up as in the cartesian plane
      

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
          graphObject.ShiftGraph(event.clientX - this.dragCoords.x,(this.dragCoords.y - event.clientY) ); 

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
    ChangeDefaultScaling(){
      if(this.lowerLimitX < -200 &&this.upperLimitX > 200){
        this.Scale(400/(Math.abs(this.upperLimitX) + Math.abs(this.lowerLimitX)))
      }
    },
    ExpressionValidifier(exp){ // checks expression before making calculations to avoid wasting resources
      
      
        try {
          if(typeof(evaluate(exp,{x: 1})) != "number"){ // todo fix if assymtote =1
            console.log("NaN error")
            return false;
          }
        }
       catch (error) {
        console.log("parseError")
        return false;
        }
      
      
      return true;
       

    },
  
    calculate : function(input,expression){
      
      const scope = {
        x: input
      }
      
      return evaluate(expression,scope);
        
      
    }
    ,
  
    GraphCalculator: function() { // drawing your own graphs
      this.ClearAll();
      this.DrawAxes();
      
      for(let z = 0;z<this.expressions.length;z++){
        let curExpression =this.expressions[z].expr;
        if(this.ExpressionValidifier(this.expressions[z].expr) === true){
          graphContext.beginPath();
          graphContext.strokeStyle = this.expressions[z].colour;
          graphContext.moveTo(this.expressions[z].domain[0],this.calculate(this.expressions[z].domain[0],curExpression));

            let lowerLimitOfLoop;
            let upperLimitOfLoop;
            if(this.expressions[z].domain[0] > this.lowerLimitX){ // checks if domain or edge of canvas is closer and sets it to the limits of the loop
              lowerLimitOfLoop = this.expressions[z].domain[0];
            }else{
              lowerLimitOfLoop = this.lowerLimitX;
            }
            if(this.expressions[z].domain[1] < this.upperLimitX){
              upperLimitOfLoop = this.expressions[z].domain[1];
            }else{
              upperLimitOfLoop = this.upperLimitX;
            }

          for(let i = lowerLimitOfLoop ; i < upperLimitOfLoop ; i+= this.pointInterval){
            
            
            graphContext.lineTo(i,this.calculate(i,curExpression));

            
            
            
          }

          graphContext.stroke();
        }
        
      }
      
    },
     
    
    Scale: function(ratio){ 
      if(this.upperLimitX * ratio > 1000){
        ratio = 1000/this.upperLimitX
      }
      if(this.lowerLimitX * ratio < -1000){
        ratio = -1000/this.lowerLimitX
      }
      this.pointInterval *=ratio;
      this.zoomRatio *=ratio;
      this.fontSize*=ratio;
      graphContext.scale(1/ratio,1/ratio);
      this.lowerLimitX *=ratio;
      
      this.upperLimitX *=ratio;
      this.lowerLimitY *=ratio;
      this.upperLimitY *=ratio;
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
      graphContext.strokeStyle = "#000000"
      graphContext.moveTo(this.lowerLimitX,0);
      graphContext.lineTo(this.upperLimitX,0);

      graphContext.moveTo(0,this.upperLimitY);
      graphContext.lineTo(0,this.lowerLimitY);
      graphContext.stroke();

      graphContext.save();
      graphContext.scale(1,-1);

      const roundedlowerLimitX = Math.floor(this.lowerLimitX/100)*100; // numbering
      const roundedupperLimitX = Math.ceil(this.upperLimitX/100)*100;
      graphContext.font= this.fontSize+'px sans-serif';
      for(let x = roundedlowerLimitX ; x < roundedupperLimitX; x+=(roundedupperLimitX-roundedlowerLimitX)/this.numGrids){ // numbering
        
        
        graphContext.fillText(x, x, -1);
        
      }
  
      const roundedlowerLimitY = Math.floor(this.lowerLimitY/100)*100; // numbering
      const roundedupperLimitY = Math.ceil(this.upperLimitY/100)*100;

      for(let y = roundedlowerLimitY ; y < roundedupperLimitY; y+=(roundedupperLimitY-roundedlowerLimitY)/this.numGrids){ // numbering
        
        
        graphContext.fillText(y, 1, -y);
        
      }
      
      graphContext.restore();
      

    },
    ShiftGraph: function(shiftByX,shiftByY){ 
      
      shiftByX*=this.zoomRatio;
      shiftByY*=this.zoomRatio;
      if(this.upperLimitX-shiftByX > 1000){
        shiftByX = 1000-this.upperLimitX
      }
      if(this.lowerLimitX-shiftByX < -1000){
        shiftByX = -1000-this.lowerLimitX
      }
      

      graphContext.transform(1, 0, 0, 1, shiftByX, shiftByY);
      this.upperLimitX-=shiftByX;
      this.lowerLimitX-=shiftByX;
      this.upperLimitY-=shiftByY;
      this.lowerLimitY-=shiftByY;
      this.GraphCalculator();
      

    },
    
    
  }

  class expression{
    constructor(expr,domain,colour){
      this.expr = expr;
      this.domain = domain
      this.colour = colour
      }
  
  }
//#endregion


//#region Timing graph
const timingCanvas = document.getElementById("timingCanvas");
const timingContext = timingCanvas.getContext("2d");


let timingGraphObject = {
  Setup: function(){
    this.beatsPerScreen = 8+1; // one less than true
    this.timeBetweenBeats = 1000; // in milliseconds
    this.beat = 1;
    this.audioSources = [new audioSource(audioCtx,"sine")]; // default first instrument/graph
    this.timer = 0;
  },
  MoveTimerBar: function(){
  
      
    if(this.beat >= this.beatsPerScreen){
      this.beat = 1;
    }
    timingContext.clearRect(0,0,graphCanvasWidth,graphCanvasHeight);
    timingContext.beginPath();
    timingContext.moveTo(graphCanvasWidth/this.beatsPerScreen * this.beat,0);
    timingContext.lineTo(graphCanvasWidth/this.beatsPerScreen * this.beat,graphCanvasHeight);
    timingContext.stroke();
    
    
    this.beat++;
    let timerBarPosition = Math.round(graphObject.lowerLimitX + (graphObject.upperLimitX-graphObject.lowerLimitX)/this.beatsPerScreen*(this.beat-1))
    
    for(let i = 0; i <this.audioSources.length; i++){
      if(graphObject.ExpressionValidifier(graphObject.expressions[i].expr) === true && timerBarPosition >= graphObject.expressions[i].domain[0] && timerBarPosition <= graphObject.expressions[i].domain[1]){
        let newFreq =  graphObject.calculate(Math.round(graphObject.lowerLimitX + (graphObject.upperLimitX-graphObject.lowerLimitX)/this.beatsPerScreen*(this.beat-1)),graphObject.expressions[i].expr);
        if(newFreq <= -24000){
          this.audioSources[i].changeFrequency(-24000);
        }
        else if(newFreq >= 24000){
          this.audioSources[i].changeFrequency(24000);

        }
        else if(isNaN(newFreq)=== false){
          this.audioSources[i].changeFrequency(newFreq);

        }
        else{
          this.audioSources[i].changeFrequency(0);

        }
        
        this.audioSources[i].play();
      }
    }
    this.timer = setTimeout(() => {
      this.MoveTimerBar();
    }, this.timeBetweenBeats);
    
  
  }
 
}

//#endregion

//#region Audio

let audioCtx = null;

class audioSource{
  constructor(audioCtx){  
    this.audioCtx = audioCtx;
    this.osc = audioCtx.createOscillator();
    this.g = audioCtx.createGain();
    this.osc.connect(this.g);
    this.g.connect(audioCtx.destination);
    this.osc.start();
    this.g.gain.setValueAtTime(0,audioCtx.currentTime);
  }
  play(){
    this.g.gain.setValueAtTime(1,audioCtx.currentTime);
    this.g.gain.exponentialRampToValueAtTime(
      0.00001, audioCtx.currentTime + 1
    )
  
  }
  changeFrequency(newFreq){

      this.osc.frequency.value = newFreq;
    }
  changeAudioType(newAudioType){

    //console.log(newAudioType);
    this.osc.type = newAudioType;
  }
  
  

}

  //#endregion
  
//#region React components
  class AllInputs extends React.Component{

    constructor(){
      super()
      this.state = {components: [0]};
      this.IDCount = 0;
    }
    create(id){
      let prevState = this.state.components
      this.IDCount++;
      let idIndex = prevState.findIndex(el => el === id);
      prevState.splice(idIndex + 1,0,this.IDCount)
      graphObject.expressions.splice(idIndex + 1,0,new expression("",[-1000,1000],"#000000"))
      timingGraphObject.audioSources.splice(idIndex +1,0,new audioSource(audioCtx))
      this.setState({components: prevState});
      //console.log(this.state.components)
    }

    delete(id){
      let prevState = this.state.components
      let idIndex = prevState.findIndex(el => el === id);
      prevState.splice(idIndex,1);
      graphObject.expressions.splice(idIndex,1);
      timingGraphObject.audioSources.splice(idIndex,1);
      this.setState({components: prevState});
      //console.log(this.state.components);
      graphObject.GraphCalculator();
    }
    changeAudioType(id,newAudioType){
      let idIndex = this.state.components.findIndex(el => el === id);
      timingGraphObject.audioSources[idIndex].changeAudioType(newAudioType);

    }
    changeDomain(id,newValue){
      let idIndex = this.state.components.findIndex(el => el === id);
      graphObject.expressions[idIndex].domain = newValue;
      graphObject.GraphCalculator();

    }
    changeColour(id,newColour){
      let idIndex = this.state.components.findIndex(el => el === id);
      graphObject.expressions[idIndex].colour = newColour;
      graphObject.GraphCalculator();
    }

    render(){
      return( 
        <div>
          <InputBox components = {this.state.components} deleteFunction = {this.delete.bind(this)}
           createFunction = {this.create.bind(this)} changeAudioTypeFunction= {this.changeAudioType.bind(this)} changeDomainFunction={this.changeDomain.bind(this)}
            changeColourFunction={this.changeColour.bind(this)}/>

        </div>

      )
    }

  }

  class InputBox extends React.Component{ // where we type in the function and clear
   
    constructor(props){
      super(props)
      this.handleChangeDomain = this.handleChangeDomain.bind(this);
      this.handleChangeColour = this.handleChangeColour.bind(this);
      this.handleCreate = this.handleCreate.bind(this);
      this.handleAudiotypeChange = this.handleAudiotypeChange.bind(this);


      
    }
    handleCreate(id){
      this.props.createFunction(id);
      
    }
    handleDelete(id){
      this.props.deleteFunction(id);
    }
    handleAudiotypeChange(id){
      let newAudioType = document.getElementById(id + "audioType").value;
      this.props.changeAudioTypeFunction(id,newAudioType);
      
    }
    handleChangeDomain(id,newValue){
      
      this.props.changeDomainFunction(id,newValue);
      
    }
    handleChangeColour(id,newColour){
      this.props.changeColourFunction(id,newColour.target.value);
    }
    

    render(){
      return(
        
        <div>
          {
            this.props.components.map(comp =>
              
              <div key={comp}>
                <p>{comp}</p>
                <Input  components={this.props.components} id={comp}/>
                <label>Domain</label>
                
                <div >
                  {
                   <ReactSlider
                   defaultValue={[-1000, 1000]}
                   max={1000}
                   min={-1000}
                   renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
                   onAfterChange={val => {this.handleChangeDomain(comp,val);}}
                   className="horizontal-slider"
                   thumbClassName="sliderThumb"
                   trackClassName="sliderTrack"
                   pearling={true}
                   
                   />
                  }
                  
                </div>
                <div>
                  {this.props.components.length > 1 &&
                    <button onClick={this.handleDelete.bind(this,comp)}>Delete this graph</button>
                  }
                </div>
                <div>
                  <input type="color" onChange={this.handleChangeColour.bind(this,comp)}></input>
                </div>
               
                <div>
                  <select id={comp + "audioType"} onChange={this.handleAudiotypeChange.bind(this,comp)}>
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </div>

                <div>
                  <button onClick={this.handleCreate.bind(this,comp)}>New graph</button>
                </div>
                
              </div>
              )
              
          }
          
        </div>
      )
    }

  }
  class Input extends React.Component{
    constructor(props){
      super(props);
      this.state ={text: ""};
 
      this.handleChange = this.handleChange.bind(this);
      this.handleClear = this.handleClear.bind(this);
 
    }
     handleChange(e){
      this.setState({text: e.target.value});
      let idIndex = this.props.components.findIndex(el => el === this.props.id);
      graphObject.expressions[idIndex].expr = e.target.value;
      graphObject.GraphCalculator();
     }
     handleClear(){
       this.setState({text: ""});
       let idIndex = this.props.components.findIndex(el => el === this.props.id);
       graphObject.expressions.splice(idIndex,1,"")
       graphObject.Clear();
     }


    render(){
      return(
        <div>
          <div>
          <input onChange={this.handleChange} type="text" value= {this.state.text}></input>
          </div>
          <div>
          <button onClick={this.handleClear}>Clear</button>
          </div>
        </div>
     
      )
    }
  }
 

  class Sliders extends React.Component{
    
    constructor(){
      super()
      this.handleChangeBPS = this.handleChangeBPS.bind(this);
      this.handleChangeTBB = this.handleChangeTBB.bind(this);
    }
    
     handleChangeBPS(e){
      timingGraphObject.beatsPerScreen = e.target.value;
     
     }
     handleChangeTBB(e){
       timingGraphObject.timeBetweenBeats = e.target.value;
      
     }
 
     render(){
       return(
         <div>
           <div>
             <input onChange={this.handleChangeBPS} type="range" min="1" max="100" step="1"></input>
             <label>BPS</label>
           </div>
           <div>
             <input onChange={this.handleChangeTBB} type="range" min="100" max="1000" step="100"></input>
             <label>TBB</label>
           </div>
         </div>
         
 
       )
     }

  }

  class MuteButton extends React.Component{
    constructor(){
      super()
      this.handleChange =this.handleChange.bind(this)
    }
   

    handleChange(e){
     
      if(e.target.checked === true){
        audioCtx.resume();
        
      }
      else{
        audioCtx.suspend();
        
      }
     
    }

    render(){
      return(
        <div>
          <div>
            <input onChange={this.handleChange} type="checkbox" ></input>
            <label>Enable Audio</label>
          </div>
        </div>
        

      )
    }

  }



ReactDOM.render(<AllInputs/>,document.getElementById("InputBox"));
ReactDOM.render(<Sliders/>,document.getElementById("Sliders"));
ReactDOM.render(<MuteButton/>,document.getElementById("MuteButton"));




//#endregion
function start(){
  // graph canvas size initialization
  audioCtx = new AudioContext();
  audioCtx.suspend();

  graphCanvas.width = window.innerWidth * 0.8;
  graphCanvas.height = window.innerHeight * 0.8;
  graphCanvasHeight = graphCanvas.height;
  graphCanvasWidth = graphCanvas.width;

  timingCanvas.width = window.innerWidth * 0.8;
  timingCanvas.height = window.innerHeight * 0.8;

  graphObject.Setup();
  graphObject.ChangeDefaultScaling();
  graphObject.DrawAxes();
  timingGraphObject.Setup();
  timingGraphObject.MoveTimerBar();
 
}


window.onload = start();
