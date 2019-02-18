// controls the elements,
// as well as interactions
class Stage {
  constructor(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.dragging = false;
    this.resizing = false;
    this.targetHandle = false;
    this.dragTarget = [];
    this.dragOffset = [];
    this.overlapBar = document.getElementById("bar-fill");
    this.overlapArea = document.getElementById("bar-area");
    this.canvas = document.getElementById("area");
    this.ctx = this.canvas.getContext("2d");

    // rectangles
    this.rects = [];
    // mouse position
    this.mousePos = [];
    this.prevMousePos = [];

    this.init(w, h);
  }

  init(w,h){
    this.rects = [];
    this.rects[0] =  new Rectangle(this.ctx);
    this.rects[0].x = w/2 - (w/5) - 10;
    this.rects[0].y = h/2 - (h/10);
    this.rects[0].width = this.width/5;
    this.rects[0].height = this.height/5;
    this.rects[0].fillStyle = "#F7D406";//""#9972ee";
    this.rects[0].draw();

    this.rects[1] =  new Rectangle(this.ctx);
    this.rects[1].x = w/2 + 10;
    this.rects[1].y = h/2 - (h/10);
    this.rects[1].width = w/5;
    this.rects[1].height = h/5;
    this.rects[1].fillStyle = "#06ADF7";//"#0055cc";
    this.rects[1].draw();

    this.resize(w,h);
    this.initMouseEvents();
  }

  setLabel(str){
    document.getElementById("label").innerHTML = str;
    //console.log(str);
  }

  resize(w,h){
    //proportional to original width/height
    this.rects.forEach((rect) => {
      rect.width = w*(rect.width/this.width);
      rect.height = h*(rect.height/this.height);
      rect.x = w*(rect.x/this.width);
      rect.y = h*(rect.y/this.height);
    });

    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;

    this.draw();
  }

  draw(){
    let canvas = this.canvas;
    let overlap = {};

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 0.5;

    // redraw rectangle 1
    this.rects[0].draw();
    // redraw rectangle 2
    this.rects[1].draw();

    overlap = this.getOverlap(this.rects[0], this.rects[1]);
    this.overlapBar.style.width = (overlap.ratio*100) + "%";
    this.overlapArea.innerHTML = overlap.area + " px²";

  }

  initMouseEvents(){
    let canvas = this.canvas;

    // on start drag (or click)
    canvas.addEventListener('mousedown', e => this.onDragStart(e));
    canvas.addEventListener('touchstart', e => this.onDragStart(e));

    // on mousemove
    canvas.addEventListener('mousemove', e => this.onDragMove(e));
    canvas.addEventListener('touchmove', e => this.onDragMove(e));

    // on stop drag (or mouse up)
    canvas.addEventListener('mouseup', e => this.onDragEnd(e));
    canvas.addEventListener('touchend', e => this.onDragEnd(e));

    canvas.addEventListener("touchcancel", e => this.onDragCancel(e));

    // prevent text selection
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  }

  onDragStart(e){
    let canvas = this.canvas;
    let tgt = [], handle;

    if(this.dragTarget.length > 1){
      e.preventDefault();
      return;
    }

    if(e.touches){
      // is touch device, so use touches
      e.preventDefault();
      for(var ti=0; ti<e.touches.length; ti++){
        if(ti > 1){break;}
        this.mousePos[ti] = {};
        this.mousePos[ti].x = e.touches[ti].pageX - canvas.offsetLeft;
        this.mousePos[ti].y = e.touches[ti].pageY - canvas.offsetTop;
        this.prevMousePos[ti] = {};
        this.prevMousePos[ti].x = e.touches[ti].pageX - canvas.offsetLeft;
        this.prevMousePos[ti].y = e.touches[ti].pageY - canvas.offsetTop;
      }
    }else{
      //not touch device, use mouse
      this.mousePos[0] = {};
      this.mousePos[0].x = e.pageX - canvas.offsetLeft;
      this.mousePos[0].y = e.pageY - canvas.offsetTop;
      this.prevMousePos[0] = {};
      this.prevMousePos[0].x = e.pageX - canvas.offsetLeft;
      this.prevMousePos[0].y = e.pageY - canvas.offsetTop;
    }

    // remove previous highlight
    if(this.dragTarget.length > 0){
      this.dragTarget.forEach(function(t) {
        t.highlighted = false;
      })
    }

    //this.targetHandle = false;
    for(var i=this.rects.length-1; i>=0; i--){
      for(var m=0; m < this.mousePos.length; m++){
        var mp = this.mousePos[m];
        // which rects are we pointing to?
        if(this.isPointOverRect(mp.x, mp.y, this.rects[i])){
          if(tgt.length == 0 || (e.touches && e.touches.length > 1) ){ //do not select both on same click
            tgt.push(this.rects[i]);
          }
        }
      };
    }

    for(var i=this.rects.length-1; i>=0; i--){
      this.rects[i].highlighted = false;
    }

    if(this.rects[1].getHandle(mp.x, mp.y) && !this.rects[0].getHandle(mp.x, mp.y)){
      this.targetHandle = this.rects[1].getHandle(mp.x, mp.y);
    }else{
      this.targetHandle = false;
    }

    if(this.targetHandle && tgt.length > 1){
      tgt.splice(1,1);
    }

    this.dragging = false;
    this.resizing = false;

    if(tgt.length > 0){
      // based on number and position of touches,
      // change mode of interaction
      //tgt.length == 1 &&
      if( (this.targetHandle != false) ||
          (this.mousePos.length > 1  && tgt[0] == tgt[1]) ){
        this.dragging = false;
        this.resizing = true;
      }else if( (tgt.length == 1 && this.targetHandle == false) ||
          (tgt.length > 1  && tgt[0] != tgt[1]) ){
        this.dragging = true;
        this.resizing = false;
      }else{
        this.dragging = false;
        this.resizing = false;
      }

      for(var ti = 0; ti < tgt.length; ti++){
        this.dragTarget[ti] = tgt[ti];
        if(this.mousePos[ti]){
          this.dragOffset[ti] = {x:this.mousePos[ti].x - tgt[ti].x, y:this.mousePos[ti].y - tgt[ti].y};
        }else{
          this.dragOffset[ti] = 0;
        }

        if(e.touches){
          this.dragTarget[ti].highlighted = true;
        }
      }
      this.dragTarget[0].highlighted = true;

      // splice the array to change depth of
      // clicked rectangle
      this.rects.splice( this.rects.indexOf(tgt[0]), 1 );
      this.rects.push(tgt[0]);
    }else{
      // if there's no drag target, reset values
      this.onDragEnd(e);
    }
  }

  onDragMove(e){
    let canvas = this.canvas;
    let rect, cursorTgt;
    let diffX=0, diffY=0;

    if(!e){
      var e = event;
    }
    if(e.touches){
      e.preventDefault();
      for(var ti=0; ti<e.touches.length; ti++){
        if(ti > 1){break;}
        this.mousePos[ti] = {};
        this.mousePos[ti].x = Math.floor(e.touches[ti].pageX) - canvas.offsetLeft;
        this.mousePos[ti].y = Math.floor(e.touches[ti].pageY) - canvas.offsetTop;
      }
    }else{
      this.mousePos[0] = {};
      this.mousePos[0].x = Math.floor(e.pageX) - canvas.offsetLeft;
      this.mousePos[0].y = Math.floor(e.pageY) - canvas.offsetTop;
    }
    rect = this.dragTarget[0];

    if((this.resizing && rect != null) ){
      this.setLabel("drag & <span>resize</span>");

      if(this.dragTarget.length == 1){
        // only one finger/pointer on same rectangle...
        diffX = this.prevMousePos[0].x - this.mousePos[0].x;
        diffY = this.prevMousePos[0].y - this.mousePos[0].y;
      }else{
        // two fingers on same rectangle...
        diffX = (this.prevMousePos[1].x - this.mousePos[1].x) - (this.prevMousePos[0].x - this.mousePos[0].x);
        diffY = (this.prevMousePos[1].y - this.mousePos[1].y) - (this.prevMousePos[0].y - this.mousePos[0].y);

        if(this.mousePos[1].x < this.mousePos[0].x){
          diffX = -diffX;
        }
        if(this.mousePos[1].y < this.mousePos[0].y){
          diffY = -diffY;
        }
      }

      if( this.targetHandle == "topLeft" ){
        rect.width += diffX;
        rect.height += diffY;
        rect.x -= diffX;
        rect.y -= diffY;
      }else if( this.targetHandle == "topRight" ){
        rect.width -= diffX;
        rect.height += diffY;
        rect.x = rect.x;
        rect.y -= diffY;
      }else if( this.targetHandle == "bottomLeft" ){
        rect.width += diffX;
        rect.height -= diffY;
        rect.x -= diffX;
        rect.y = rect.y;
      }else if( this.targetHandle == "bottomRight" ){
        rect.width -= diffX;
        rect.height -= diffY;
        rect.x = rect.x;
        rect.y = rect.y;
      }else{
        rect.width -= diffX;
        rect.height -= diffY;
        rect.x += diffX/2;
        rect.y += diffY/2;
      }

    }else if(this.dragging){
      this.setLabel("<span>drag</span> & resize");
      this.dragTarget.forEach((dt, di) => {
        if(this.mousePos[di]){
          dt.x = this.mousePos[di].x - this.dragOffset[di].x;
          dt.y = this.mousePos[di].y - this.dragOffset[di].y;
        }
      })
    }

    // is the mouse pointing to a rectangle?
    if(!e.touches){
      for(var i=this.rects.length-1; i>=0; i--){
        this.rects[i].highlighted = false;
      }
      for(var i=this.rects.length-1; i>=0; i--){
        if(this.isPointOverRect(this.mousePos[0].x, this.mousePos[0].y, this.rects[i])){
          cursorTgt = this.rects[i];
          this.rects[i].highlighted = true;
          break;
        }
      }

      if(cursorTgt != null){
        canvas.classList.add("pointing");
      }else{
        canvas.classList.remove("pointing");
      }

      this.prevMousePos[0] = {};
      this.prevMousePos[0].x = Math.floor(e.pageX) - canvas.offsetLeft;
      this.prevMousePos[0].y = Math.floor(e.pageY) - canvas.offsetTop;
    }else{
      e.preventDefault();
      for(var ti=0; ti<e.touches.length; ti++){
        if(ti > 1){break;}
        this.prevMousePos[ti] = {};
        this.prevMousePos[ti].x = Math.floor(e.touches[ti].pageX) - canvas.offsetLeft;
        this.prevMousePos[ti].y = Math.floor(e.touches[ti].pageY) - canvas.offsetTop;
      }
    }
  }

  onDragCancel(e){
    // reset values
    this.onDragEnd(e);
  }

  onDragEnd(e){
    // reset values
    this.dragging = false;
    this.resizing = false;
    this.targetHandle = false;
    this.dragTarget = [];
    this.dragOffset = [];

    this.mousePos = [];
    this.prevMousePos = [];

    this.setLabel("drag & resize");
  }

  // test (true, false) if x, y is inside the bounding box of a rectangle
  isPointOverRect(rX, rY, rect){
    return (  rX >= rect.x - rect.handleWidth && rX <= rect.x + rect.width + rect.handleWidth &&
              rY >= rect.y - rect.handleWidth && rY <= rect.y + rect.height + rect.handleWidth );
  }

  getOverlap(r1, r2){
    let area1 = (r1.right - r1.left) * (r1.bottom - r1.top);
    let area2 = (r2.right - r2.left) * (r2.bottom - r2.top);
    let maxOverlap = Math.min(area1, area2);
    let currOverlap = 0;
    let overlapRatio = 0;

    let l = Math.max(r1.left, r2.left);
    let r = Math.min(r1.right, r2.right);
    let b = Math.min(r1.bottom, r2.bottom);
    let t = Math.max(r1.top, r2.top);

    if( l < r && b > t ){
      currOverlap = (r - l) * (b - t);
      overlapRatio = Math.round(currOverlap*100/maxOverlap)/100;
    }

    return { area: currOverlap, ratio: overlapRatio };
  }
}

// instantiates a Rectangle
// with resize handles
class Rectangle {
    constructor(context) {
      this.ctx = context;
      this._x = 0;
      this._y = 0;
      this._width = 0;
      this._height = 0;
      this._center = {x:0, y:0};
      this._left = 0;
      this._right = 0;
      this._top = 0;
      this._bottom = 0;
      this.fillStyle = "#ccc";
      this.lineWidth = 0;
      this.strokeStyle = "#fff";
      this.highlighted = false;
      this.handleWidth = 15;
      this.handles = [];

      this.draw();
    }

    set x(val){
      this._x = val;
      this._left = this._x;
      this._right = this._x + this._width;
      this.repositionHandles();
    }
    set y(val){
      this._y = val;
      this._top = this._y;
      this._bottom = this._y + this.height;
      this.repositionHandles();
    }

    get x(){
      return Math.floor(this._x);
    }
    get y(){
      return Math.floor(this._y);
    }

    get center(){
      this.resetCenter();
      return this._center;
    }

    set width(val){
      this._width = val;
      val < this.handleWidth*3 ? this._width = this.handleWidth*3 : this._width = val;
      this.repositionHandles();
    }
    set height(val){
      this._height = val;
      val < this.handleWidth*3 ? this._height = this.handleWidth*3 : this._height = val;
      this.repositionHandles();
    }

    get width(){
      return Math.floor(this._width);
    }
    get height(){
      return Math.floor(this._height);
    }

    get left(){
      return Math.floor(this._left);
    }
    get right(){
      return Math.floor(this._right);
    }
    get top(){
      return Math.floor(this._top);
    }
    get bottom(){
      return Math.floor(this._bottom);
    }

    resetCenter(){
      this._center.x = this._x + this._width/2;
      this._center.y = this._y + this._height/2;
    }

    draw() {
      this.ctx.fillStyle = this.fillStyle;
      this.ctx.fillRect(this.x, this.y, this.width, this.height);

      this.highlighted ? this.lineWidth = 2 : this.lineWidth = 0;

      if(this.lineWidth > 0){
        this.ctx.globalAlpha = 1;
        this.ctx.strokeStyle = this.strokeStyle;
        this.ctx.lineWidth   = this.lineWidth;
        this.ctx.strokeRect(this.x, this.y, this.width, this.height);

        // resize handles
        this.ctx.fillStyle = "#fff";

        for(var i=0; i<this.handles.length; i++){
          this.ctx.fillRect(this.handles[i].x, this.handles[i].y, this.handleWidth, this.handleWidth);
        }
        this.ctx.globalAlpha = 0.5;
      }
    }

    repositionHandles(){
      let half = this.handleWidth/2;
      // set mouse/touch positions for each handle
      this.resetCenter();
      this.handles[0] = {x:this.x - half, y:this.y - half, name: "topLeft"};
      this.handles[1] = {x:this.x + this.width - this.handleWidth + half, y:this.y - half, name: "topRight"};
      this.handles[2] = {x:this.x - half, y:this.y + this.height - this.handleWidth + half, name: "bottomLeft"};
      this.handles[3] = {x:this.x + this.width - this.handleWidth + half, y:this.y + this.height - this.handleWidth + 5, name: "bottomRight"};
    }

    getHandle(x, y){
      let handlePos = false;
      let handles = this.handles;
      let spaceBefore = .5*this.handleWidth;
      let spaceAfter = 2*this.handleWidth;

      // check if a handle is selected
      for(var i=0; i<handles.length; i++){
        if( x >= handles[i].x - spaceBefore && x <= handles[i].x + spaceAfter &&
            y >= handles[i].y - spaceBefore && y <= handles[i].y + spaceAfter ){
              handlePos = handles[i].name;
        }
      }

      // return the handle position
      return handlePos;
    }
}

var stage = new Stage(0,0,window.innerWidth,window.innerHeight);

var onPageResize = function(event){
  let h = window.innerHeight;
  let w = window.innerWidth;
  stage.resize(w,h);
}
window.addEventListener("resize", onPageResize);

var redraw = function(){
  stage.draw();
  window.requestAnimationFrame(redraw);
}
window.requestAnimationFrame(redraw);
