import React from 'react';
import ReactDOM from "react-dom";
import './App.css';
import { derivative, electronMassDependencies, parse } from 'mathjs';
import ReactSlider from 'react-slider';
import { create, all } from 'mathjs';
import { Col, Container, ListGroup, Row, Navbar } from 'react-bootstrap';

//#region Graph Actions

let graphCanvas;
let graphContext;


const math = require('mathjs');
const Instruments = require('webaudio-instruments');
const restrictedMath = create(all)
const restrictedEvaluate = restrictedMath.evaluate;
restrictedMath.import({
  'import': function () { return },
  'createUnit': function () { return },
  'evaluate': function () { return },
  'parse': function () { return },
  'simplify': function () { return },
  'derivative': function () { return },

}, { override: true })

let pointsPlotted = 0;



let graphObject = { // main object, with all graphCanvas manipulation methods

  Setup: function () {


    this.plotsPerScreen = 750; //TODO allow this to change for different processor strengths
    this.numGrids = 20; // number of grid markings
    this.expressions = [{ expr: "", domain: [-1000, 1000], colour: "#000000", verticalAsymptotes: null }]; // array of objects that gets all info about a certain expression colour, value and domains. Initialised with empty graph

    this.scaleColour = "#000D34";
    graphContext.lineJoin = "round";

    if (window.innerWidth < 992) { // if the window less than lg breakpoint
      this.WindowSizeChange(window.innerWidth * 0.95, window.innerHeight * 0.5);

    }
    else {
      this.WindowSizeChange(window.innerWidth * 0.65, window.innerHeight * 0.9);

    }

  },
  WindowSizeChange: function (width, height) {
    graphCanvas.width = width;
    graphCanvas.height = height;
    timingCanvas.width = width;
    timingCanvas.height = height;

    this.upperLimitX = graphCanvas.width / 2;
    this.lowerLimitX = -graphCanvas.width / 2;
    this.upperLimitY = graphCanvas.height / 2;
    this.lowerLimitY = -graphCanvas.height / 2;
    this.pointInterval = graphCanvas.width / this.plotsPerScreen; // changes for balance of smoothness of line with time to compute, decrease with more zoom increase with less zoom, by default 1000 plots per screen

    graphContext.setTransform(1, 0, 0, -1, graphCanvas.width / 2, graphCanvas.height / 2); // inverts y-axis in order to increase as you move further up as in the cartesian plane
    this.fontSize = 10;
    this.functionWidth = "0.5";
    this.minorScaleWidth = "0.1";
    this.zoomRatio = 1; // each pixel equals one unit at the start
    timingContext.strokeStyle = "#56DACC";
    timingContext.lineWidth = 2;

    this.ChangeDefaultScaling()

    this.GraphCalculator();

  },
  ChangeDefaultScaling() {
    if (this.lowerLimitX < -1000 || this.upperLimitX > 1000) {
      this.Scale(2000 / (Math.abs(this.upperLimitX) + Math.abs(this.lowerLimitX)))

    }

  },
  ExpressionValidifier(exprText, idIndex) { // checks expression before making calculations to avoid wasting resources
    graphObject.expressions[idIndex].validity = false;
    let exprObject;

    try { // first test is to try and parse the expression
      exprObject = parse(exprText);

      console.log(exprObject)
      console.log(exprObject.toString())


    } catch (error) {
      console.log("couldn't parse")
      return false;
    }
    // second test is to see if all variables are x

    let symbolNodes = exprObject.filter(function (node) {
      return node.isSymbolNode
    })
    let operatorNodes = exprObject.filter(function (node) {
      return node.isOperatorNode;
    })
    let functionNodes = exprObject.filter(function (node) {
      return node.isFunctionNode;
    })
    // since symbolnodes are used for variables and functions, we must check that all symbolnodes are
    // either x or a function, also check that no operation is done that has a symbolnode that is not x
    for (let i = 0; i < functionNodes.length; i++) {
      if (functionNodes[i].args.length < 1) {
        console.log("non acceptable operation found")

        return false;
      }
    }
    if (symbolNodes.length > 0) {

      for (let i = 0; i < symbolNodes.length; i++) {

        if (symbolNodes[i].name === 'x' || symbolNodes[i].name in math) {


        }
        else {
          console.log("non acceptable symbolnode found")
          return false;
        }

      }
      for (let i = 0; i < operatorNodes.length; i++) { // check that no operation is done with non x symbolnode, otherwise tan * 4 etc would break it
        if (operatorNodes[i].isBinary()) {
          if (operatorNodes[i].args[0].isSymbolNode && operatorNodes[i].args[0].name !== 'x') {
            console.log("non acceptable operation found")
            return false;
          }
          if (operatorNodes[i].args[1].isSymbolNode && operatorNodes[i].args[1].name !== 'x') {
            console.log("non acceptable operation found")
            return false;
          }
        }
        if (operatorNodes[i].isUnary()) { // protests from x! as no negative factorials allowed
          if (operatorNodes[i].args[0].isSymbolNode) {
            console.log("non acceptable operation found")
            return false;
          }

        }

      }

    }


    //tests passed, expression valid
    // get the derivative as well and add it as a property

    graphObject.expressions[idIndex].validity = true;
    try {
      graphObject.expressions[idIndex].derivative = derivative(exprObject, "x").toString();

    }
    catch {
      console.log("derivative couldn't be found")
    }

    return true


  },

  calculate: function (input, expression) {

    const scope = {
      x: input
    }

    return restrictedEvaluate(expression, scope);


  }
  ,

  GraphCalculator: function () { // drawing your own graphs - doesn't work well when asymptotes but oh well
    pointsPlotted = 0;
    this.ClearAll();
    this.DrawAxes();

    let curGradient;
    let prevGradient;

    let curY;
    let prevY;

    let prevPointInterval = this.pointInterval;
    graphContext.lineWidth = graphObject.functionWidth;

    for (let z = 0; z < this.expressions.length; z++) {

      let curExpression = this.expressions[z].expr;
      let curDerivative = this.expressions[z].derivative;
      if (this.expressions[z].validity === true) {

        graphContext.beginPath();
        graphContext.strokeStyle = this.expressions[z].colour;
        graphContext.moveTo(this.expressions[z].domain[0], this.calculate(this.expressions[z].domain[0], curExpression));

        let lowerLimitOfLoop;
        let upperLimitOfLoop;
        if (this.expressions[z].domain[0] > this.lowerLimitX) { // checks if domain or edge of canvas is closer and sets it to the limits of the loop
          lowerLimitOfLoop = this.expressions[z].domain[0];
        } else {
          lowerLimitOfLoop = this.lowerLimitX;
        }
        if (this.expressions[z].domain[1] < this.upperLimitX) {
          upperLimitOfLoop = this.expressions[z].domain[1];
        } else {
          upperLimitOfLoop = this.upperLimitX;
        }

        for (let i = lowerLimitOfLoop; i < upperLimitOfLoop; i += this.pointInterval) {

          curY = this.calculate(i, curExpression)
          curGradient = this.calculate(i, curDerivative);

          if (Math.sign(curGradient) === -1 && Math.sign(prevGradient) === -1 && curY > prevY) {
            graphContext.lineTo(i, -10000);
            graphContext.stroke();
            graphContext.beginPath();
            graphContext.moveTo(i + 0.001, 10000);
          }
          else if (Math.sign(curGradient) === 1 && Math.sign(prevGradient) === 1 && curY < prevY) {
            graphContext.lineTo(i, 10000);
            graphContext.stroke();
            graphContext.beginPath();
            graphContext.moveTo(i + 0.001, -10000);

          }
          else {
            graphContext.lineTo(i, curY);

          }


          prevY = curY;
          prevGradient = curGradient;


          pointsPlotted++;


        }
        console.log(pointsPlotted);

        graphContext.stroke();
        this.pointInterval = prevPointInterval;
        console.log(this.pointInterval);

      }

    }

  },


  Scale: function (ratio) {
    if (this.upperLimitX * ratio > 1000) {
      ratio = 1000 / this.upperLimitX
    }
    if (this.lowerLimitX * ratio < -1000) {
      ratio = -1000 / this.lowerLimitX
    }
    this.pointInterval *= ratio;
    this.zoomRatio *= ratio;
    this.fontSize *= ratio;
    graphContext.scale(1 / ratio, 1 / ratio);
    this.lowerLimitX *= ratio;

    this.upperLimitX *= ratio;
    this.lowerLimitY *= ratio;
    this.upperLimitY *= ratio;
    this.functionWidth *= ratio;
    this.minorScaleWidth *= ratio;
    this.GraphCalculator();

  },
  ClearAll: function () {
    graphContext.save();
    graphContext.setTransform(1, 0, 0, 1, 0, 0);
    graphContext.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    graphContext.restore();
  },
  Clear: function () {
    this.GraphCalculator();
  },
  DrawAxes: function () {

    graphContext.beginPath(); // axes
    graphContext.strokeStyle = graphObject.scaleColour;
    graphContext.lineWidth = graphObject.functionWidth;

    graphContext.moveTo(this.lowerLimitX, 0);
    graphContext.lineTo(this.upperLimitX, 0);

    graphContext.moveTo(0, this.upperLimitY);
    graphContext.lineTo(0, this.lowerLimitY);

    graphContext.stroke();


    const roundedlowerLimitX = Math.floor(this.lowerLimitX / 1000) * 1000; // setup for minor axes
    const roundedupperLimitX = Math.ceil(this.upperLimitX / 1000) * 1000;
    const roundedlowerLimitY = Math.floor(this.lowerLimitY / 1000) * 1000;
    const roundedupperLimitY = Math.ceil(this.upperLimitY / 1000) * 1000;


    graphContext.font = this.fontSize + 'px sans-serif';
    graphContext.fillStyle = graphObject.scaleColour;
    graphContext.lineWidth = graphObject.minorScaleWidth;


    for (let x = roundedlowerLimitX; x < roundedupperLimitX; x += 100) { // minor axes

      graphContext.moveTo(x, this.upperLimitY);
      graphContext.lineTo(x, this.lowerLimitY);


    }

    for (let y = roundedlowerLimitY; y < roundedupperLimitY; y += 100) {

      graphContext.moveTo(this.lowerLimitX, y);
      graphContext.lineTo(this.upperLimitX, y);

    }

    graphContext.stroke();

    graphContext.save();
    graphContext.scale(1, -1);


    for (let x = roundedlowerLimitX; x < roundedupperLimitX; x += 100) { // numbering


      graphContext.fillText(x, x, -1);

    }

    for (let y = roundedlowerLimitY; y < roundedupperLimitY; y += 100) { // numbering


      graphContext.fillText(y, 1, -y);

    }

    graphContext.restore();


  },
  ShiftGraph: function (shiftByX, shiftByY) {

    shiftByX *= this.zoomRatio;
    shiftByY *= this.zoomRatio;
    if (this.upperLimitX - shiftByX > 1000) {
      shiftByX = 1000 - this.upperLimitX
    }
    if (this.lowerLimitX - shiftByX < -1000) {
      shiftByX = -1000 - this.lowerLimitX
    }


    graphContext.transform(1, 0, 0, 1, shiftByX, shiftByY);
    this.upperLimitX -= shiftByX;
    this.lowerLimitX -= shiftByX;
    this.upperLimitY -= shiftByY;
    this.lowerLimitY -= shiftByY;
    this.GraphCalculator();


  },


}

class expressionConstructor {
  constructor(expr, domain, colour) {
    this.expr = expr;
    this.domain = domain
    this.colour = colour
    this.verticalAsymptotes = null;
  }

}
//#endregion


//#region Timing graph
let timingCanvas;
let timingContext;


let timingGraphObject = {
  Setup: function () {


    this.beatsPerScreen = 8 + 1; // one less than true
    this.timeBetweenBeats = 1000; // in milliseconds
    this.beat = 1;
    this.audioSources = [new audioSource()]; // default first instrument/graph
    this.timer = 0;


  },
  MoveTimerBar: function () {


    if (this.beat >= this.beatsPerScreen) {
      this.beat = 1;
    }
    timingContext.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    timingContext.beginPath();
    timingContext.moveTo(graphCanvas.width / this.beatsPerScreen * this.beat, 0);
    timingContext.lineTo(graphCanvas.width / this.beatsPerScreen * this.beat, graphCanvas.height);
    timingContext.stroke();


    this.beat++;
    let timerBarPosition = Math.round(graphObject.lowerLimitX + (graphObject.upperLimitX - graphObject.lowerLimitX) / this.beatsPerScreen * (this.beat - 1))

    for (let i = 0; i < this.audioSources.length; i++) {
      if (graphObject.expressions[i].validity === true && timerBarPosition >= graphObject.expressions[i].domain[0] && timerBarPosition <= graphObject.expressions[i].domain[1]) {
        let newFreq = graphObject.calculate(Math.round(graphObject.lowerLimitX + (graphObject.upperLimitX - graphObject.lowerLimitX) / this.beatsPerScreen * (this.beat - 1)), graphObject.expressions[i].expr);


        if (newFreq <= -12000) {// todo maybe display frequency too high?
          this.audioSources[i].changeFrequency(-12000);
          this.audioSources[i].play();

        }
        else if (newFreq >= 12000) {
          this.audioSources[i].changeFrequency(12000);
          this.audioSources[i].play();


        }
        else if (isNaN(newFreq) === false) {
          this.audioSources[i].changeFrequency(newFreq);
          this.audioSources[i].play();


        }



      }
    }
    this.timer = setTimeout(() => {
      this.MoveTimerBar();
    }, this.timeBetweenBeats);


  }

}

//#endregion

//#region Audio

let muteToggle = true;
let instrumentList = new Instruments().names;

class audioSource {
  constructor() {

    this.instrumentNumber = 1; // default
    this.frequency = 0;
    this.player = new Instruments();


  }
  play() {
    if (muteToggle === false) {
      this.player.play(this.instrumentNumber, this.frequency, 1, 0, 0.5)


    }

  }
  changeFrequency(newFreq) {

    this.frequency = Math.abs(newFreq);
  }
  changeInstrument(newInstrumentNumber) {


    this.instrumentNumber = newInstrumentNumber;
    console.log(newInstrumentNumber);
  }



}

//#endregion

//#region React components
class AllInputs extends React.Component {

  constructor() {
    super()
    this.state = { components: [0] };
    this.IDCount = 0;
  }
  create(id) {
    let prevState = this.state.components
    this.IDCount++;
    let idIndex = prevState.findIndex(el => el === id);
    prevState.splice(idIndex + 1, 0, this.IDCount)
    graphObject.expressions.splice(idIndex + 1, 0, new expressionConstructor("", [-1000, 1000], "#000000"))
    timingGraphObject.audioSources.splice(idIndex + 1, 0, new audioSource())
    this.setState({ components: prevState });
    //console.log(this.state.components)
  }

  delete(id) {
    let prevState = this.state.components
    let idIndex = prevState.findIndex(el => el === id);
    prevState.splice(idIndex, 1);
    graphObject.expressions.splice(idIndex, 1);
    timingGraphObject.audioSources.splice(idIndex, 1);
    this.setState({ components: prevState });
    //console.log(this.state.components);
    graphObject.GraphCalculator();
  }
  changeInstrument(id, newInstrumentNumber) {
    let idIndex = this.state.components.findIndex(el => el === id);
    timingGraphObject.audioSources[idIndex].changeInstrument(newInstrumentNumber);

  }
  changeDomain(id, newValue) {
    let idIndex = this.state.components.findIndex(el => el === id);
    graphObject.expressions[idIndex].domain = newValue;
    graphObject.GraphCalculator();

  }
  changeColour(id, newColour) {
    let idIndex = this.state.components.findIndex(el => el === id);
    graphObject.expressions[idIndex].colour = newColour;
    graphObject.GraphCalculator();
  }

  render() {
    return (

      <InputBox components={this.state.components} deleteFunction={this.delete.bind(this)}
        createFunction={this.create.bind(this)} changeInstrumentFunction={this.changeInstrument.bind(this)} changeDomainFunction={this.changeDomain.bind(this)}
        changeColourFunction={this.changeColour.bind(this)} />



    )
  }

}

class InputBox extends React.Component { // where we type in the function and clear

  constructor(props) {
    super(props)
    this.handleChangeDomain = this.handleChangeDomain.bind(this);
    this.handleChangeColour = this.handleChangeColour.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.handleChangeInstrument = this.handleChangeInstrument.bind(this);



  }
  handleCreate(id) {
    this.props.createFunction(id);

  }
  handleDelete(id) {
    this.props.deleteFunction(id);
  }
  handleChangeInstrument(id) {
    let newAudioType = document.getElementById(id + "audioType").value;
    this.props.changeInstrumentFunction(id, newAudioType);

  }
  handleChangeDomain(id, newValue) {

    this.props.changeDomainFunction(id, newValue);

  }
  handleChangeColour(id, newColour) {
    this.props.changeColourFunction(id, newColour.target.value);
  }


  render() {
    return (

      <ListGroup>

        {
          this.props.components.map(comp =>
            <ListGroup.Item >

              <div key={comp}>
                <p>{comp}</p>
                <Input components={this.props.components} id={comp} />
                <label>Domain</label>


                {
                  <ReactSlider
                    defaultValue={[-1000, 1000]}
                    max={1000}
                    min={-1000}
                    renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
                    onAfterChange={val => { this.handleChangeDomain(comp, val); }}
                    className="horizontal-slider"
                    thumbClassName="sliderThumb"
                    trackClassName="sliderTrack"
                    pearling={true}

                  />
                }



                {this.props.components.length > 1 &&
                  <button onClick={this.handleDelete.bind(this, comp)}>Delete this graph</button>
                }


                <input type="color" onChange={this.handleChangeColour.bind(this, comp)}></input>



                <select id={comp + "audioType"} onChange={this.handleChangeInstrument.bind(this, comp)}>
                  {
                    instrumentList.map((name, index) => {
                      if (index <= 127) {
                        return <option key={index} value={index}>{name}</option>

                      }
                    })
                  }
                </select>



                <button onClick={this.handleCreate.bind(this, comp)}>New graph</button>


              </div>
            </ListGroup.Item>

          )

        }
      </ListGroup>


    )
  }

}
class Input extends React.Component {
  constructor(props) {
    super(props);
    this.state = { text: "" };

    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);

  }
  handleChange(e) {
    this.setState({ text: e.target.value });
    let idIndex = this.props.components.findIndex(el => el === this.props.id);
    graphObject.expressions[idIndex].expr = e.target.value;
    if (graphObject.ExpressionValidifier(e.target.value, idIndex) === true) {

      graphObject.GraphCalculator();
    }

  }
  handleClear() {
    this.setState({ text: "" });
    let idIndex = this.props.components.findIndex(el => el === this.props.id);
    graphObject.expressions[idIndex].expr = "";
    graphObject.expressions[idIndex].validity = false;
    graphObject.GraphCalculator();
  }


  render() {
    return (
      <div>
        <div>
          <input onChange={this.handleChange} type="text" value={this.state.text}></input>
        </div>
        <div>
          <button onClick={this.handleClear}>Clear</button>
        </div>
      </div>

    )
  }
}


class Sliders extends React.Component {

  constructor() {
    super()
    this.handleChangeBPS = this.handleChangeBPS.bind(this);
    this.handleChangeTBB = this.handleChangeTBB.bind(this);
  }

  handleChangeBPS(e) {
    timingGraphObject.beatsPerScreen = e.target.value;

  }
  handleChangeTBB(e) {
    timingGraphObject.timeBetweenBeats = e.target.value;

  }

  render() {
    return (
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

class MuteButton extends React.Component {
  constructor() {
    super()
    this.handleChange = this.handleChange.bind(this)
  }


  handleChange(e) {

    if (e.target.checked === true) {
      muteToggle = false;
    }
    else {
      muteToggle = true;

    }

  }

  render() {
    return (
      <div>

        <input onChange={this.handleChange} type="checkbox" ></input>
        <label>Enable Audio</label>

      </div>


    )
  }

}

class Graphs extends React.Component {
  constructor(props) {
    super(props);
    this.graphCanvasRef = React.createRef();
    this.timingCanvasRef = React.createRef();
    this.windowWidth = window.innerWidth;
    this.dragCoords = {
      x: 0,
      y: 0
    }
    this.dragging = false

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleResize = this.handleResize.bind(this);



  }
  componentDidMount() {
    graphCanvas = this.graphCanvasRef.current;
    graphContext = this.graphCanvasRef.current.getContext('2d');

    timingCanvas = this.timingCanvasRef.current;
    timingContext = this.timingCanvasRef.current.getContext('2d');

    window.addEventListener("resize", this.handleResize)

  }

  handleMouseDown(e) {

    this.dragging = true;
    this.dragCoords = {
      x: e.clientX,
      y: e.clientY
    }
  }
  handleMouseMove(e) {
    if (this.dragging === true) {
      graphObject.ShiftGraph(e.clientX - this.dragCoords.x, (this.dragCoords.y - e.clientY));
    }

    this.dragCoords = {
      x: e.clientX,
      y: e.clientY
    }

  }
  handleMouseUp() {

    this.dragging = false

  }
  handleMouseOut() {


    this.dragging = false

  }
  handleWheel(e) {

    if (e.deltaY < 0) {
      // Zoom out

      graphObject.Scale(0.9);
    }
    else {
      // Zoom in
      graphObject.Scale(1.1);
    }
  }
  handleResize() {
    if (window.innerWidth !== this.windowWidth) { // makes resize only happen for width changes
      console.log("sedas")
      this.windowWidth = window.innerWidth;
      if (window.innerWidth < 992) { // if the window less than lg breakpoint
        graphObject.WindowSizeChange(window.innerWidth * 0.95, window.innerHeight * 0.5);

      }
      else {
        graphObject.WindowSizeChange(window.innerWidth * 0.65, window.innerHeight * 0.9);

      }
    }

  }


  render() {
    console.log("rerender");
    return (

      <div>

        <canvas ref={this.graphCanvasRef} onPointerDown={this.handleMouseDown} onPointerMove={this.handleMouseMove}
          onPointerUp={this.handleMouseUp} onPointerOut={this.handleMouseOut} onWheel={this.handleWheel} className="graphCanvas"> </canvas>

        <canvas ref={this.timingCanvasRef} className="timingCanvas"></canvas>

      </div>
    )
  }
}
class App extends React.PureComponent {
  componentDidMount() {
    console.log("shouldrender")

    graphObject.Setup();
    graphObject.DrawAxes();
    timingGraphObject.Setup();
    timingGraphObject.MoveTimerBar();
  }
  render() {


    return (

      <div>
        <Container fluid>
          <Row>



          </Row>

          <Row>
            <Col xs={12} lg={{ span: 4, order: 'first' }} >

              <Sliders />
              <MuteButton />

              <AllInputs />
            </Col>
            <Col xs={{ span: 12, order: 'first' }} lg={8} className="mx-auto">
              <div id="graphwrapper">
                <Graphs />

              </div>

            </Col>


          </Row>



        </Container>


      </div >
    )
  }
}








//#endregion

export default App;