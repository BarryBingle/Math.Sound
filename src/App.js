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
      graphContext.setTransform(1, 0, 0, -1, graphCanvasWidth/2,graphCanvasHeight/2); // inverts y-axis in order to increase as you move further up as in the cartesian plane
      
      this.numGrids = 10; // number of grid markings
      this.pointInterval = 2; // changes for balance of smoothness of line with time to compute, increase with more zoom decrease with less zoom
      this.expressions = ["",];
      this.expressionDomains = [[-1000,1000]];
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
    ExpressionValidifier(exp){ // checks expression before making calculations to avoid wasting resources
      
      
        try {
          if(typeof(evaluate(exp,{x: 1})) != "number"){
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
        if(this.ExpressionValidifier(this.expressions[z]) === true){
          graphContext.beginPath();
          graphContext.moveTo(this.expressionDomains[z][0],this.calculate(this.expressionDomains[z][0],this.expressions[z]));
        
          for(let i = this.expressionDomains[z][0] ; i < this.expressionDomains[z][1] ; i+= this.pointInterval){
            const value = this.calculate(i,this.expressions[z]);
            if(value < this.upperLimitY && value > this.lowerLimitY){ // look at this again
              graphContext.lineTo(i,value);
            }
          }

          graphContext.stroke();
        }
        
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


      graphContext.transform(1, 0, 0, 1, shiftByX, shiftByY);
      this.upperLimitX-=shiftByX;
      this.lowerLimitX-=shiftByX;
      this.upperLimitY-=shiftByY;
      this.lowerLimitY-=shiftByY;
      this.GraphCalculator();
      

    },
    
    
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
    console.log(timerBarPosition);
    for(let i = 0; i <this.audioSources.length; i++){
      if(graphObject.ExpressionValidifier(graphObject.expressions[i]) === true && timerBarPosition >= graphObject.expressionDomains[i][0] && timerBarPosition <= graphObject.expressionDomains[i][1]){
        
        this.audioSources[i].changeFrequency( graphObject.calculate(Math.round(graphObject.lowerLimitX + (graphObject.upperLimitX-graphObject.lowerLimitX)/this.beatsPerScreen*(this.beat-1)),graphObject.expressions[i]));
        this.audioSources[i].play();
      }
    }
    setTimeout(() => {
      this.MoveTimerBar();
    }, this.timeBetweenBeats);
    
  
  }
 
}

//#endregion

//#region Audio

let audioCtx = null;

class audioSource{
  constructor(audioCtx){  // todo implement audiotype changes
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

    console.log(newAudioType);
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
      graphObject.expressions.splice(idIndex + 1,0,this.IDCount)
      graphObject.expressionDomains.splice(idIndex +1,0,[-1000,1000]) // sets domain at -1000,1000 to start
      timingGraphObject.audioSources.splice(idIndex +1,0,new audioSource(audioCtx))
      this.setState({components: prevState});
      console.log(this.state.components)
    }

    delete(id){
      let prevState = this.state.components
      let idIndex = prevState.findIndex(el => el === id);
      prevState.splice(idIndex,1);
      graphObject.expressions.splice(idIndex,1);
      timingGraphObject.audioSources.splice(idIndex,1);
      graphObject.expressionDomains.splice(idIndex,1)
      this.setState({components: prevState});
      console.log(this.state.components);
      graphObject.GraphCalculator();
    }
    changeAudioType(id,newAudioType){
      let idIndex = this.state.components.findIndex(el => el === id);
      timingGraphObject.audioSources[idIndex].changeAudioType(newAudioType);

    }
    changeDomain(id,newValue){
      let idIndex = this.state.components.findIndex(el => el === id);
      graphObject.expressionDomains.splice(idIndex,1,newValue);
      console.log(graphObject.expressionDomains)

    }

    render(){
      return( 
        <div>
          <InputBox components = {this.state.components} deleteFunction = {this.delete.bind(this)}
           createFunction = {this.create.bind(this)} changeAudioTypeFunction= {this.changeAudioType.bind(this)} changeDomainFunction={this.changeDomain.bind(this)}/>

        </div>

      )
    }

  }

  class InputBox extends React.Component{ // where we type in the function and clear
   
    constructor(props){
      super(props)
      this.handleChangeDomain = this.handleChangeDomain.bind(this);
      //this.handleDelete = this.handleDelete.bind(this);
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
      console.log(id,newAudioType)
    }
    handleChangeDomain(id,newValue){
      console.log(12)
      this.props.changeDomainFunction(id,newValue);
      
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
                  <button onClick={this.handleCreate.bind(this,comp)}>New graph</button>
                </div>
               
                <div>
                  <select id={comp + "audioType"} onChange={this.handleAudiotypeChange.bind(this,comp)}>
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="triangle">Triangle</option>
                  </select>
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
      graphObject.expressions.splice(idIndex,1,e.target.value)
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
  graphObject.DrawAxes();
  timingGraphObject.Setup();
  timingGraphObject.MoveTimerBar();
 
}


window.onload = start();
