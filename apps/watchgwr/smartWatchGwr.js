/*

TODO
- 1st BPM number is rubbisch and results alaways in an error, check for 1st and then ignore

*/



// initialise

var Clock = require("clock").Clock;
var clk=new Clock();

var Storage = require("Storage");

var dateStart;

// Are we busy?
var busy = false;
// The device, if we're connected
var connected = false;
var d;
// The 'tx' characteristic, if connected
var txCharacteristic = false;
var rxCharacteristic = false;

var lastGpsFix="";


nieuws="No\nNews\nYet";
weer="No\nWeather\nYet";
messages="No\nMessages\nYet";
var stocks="No\nStocks\nYet";

var displayHomeStruct = {
  header:"Home",
  footer:"",
  getModifiedTemp:0,
  getModifiedTime:0,
  marqueeInterval:0,
  maxColumn:0,
};

var displayStepsStruct = {
  header:"Steps",
  footer:"",
  steps:0,
  getModifiedSteps:0,
  getModifiedStepsDetails:0,
  maxColumn:0,
};

var displayGpsStruct = {
  header:"Gps",
  footer:"",
  getModifiedGpsDetails:0,
  maxColumn:0,
};

var displayHeartStruct = {
  header:"Heart",
  footer:"",
  getModifiedBpm:0,
  getModifiedDetails:0,
  bpm:0,
  maxColumn:0,
};

var displayStocksStruct = {
  header:"Stocks",
  footer:"",
  maxColumn:50,
};


var displayNewsStruct = {
  header:"News",
  footer:"",
  maxColumn:0,
};


var displayWeatherStruct = {
  header:"Weather",
  footer:"",
  maxColumn:1,
};

var displayMessagesStruct = {
  header:"Messages",
  footer:"",
  maxColumn:50,
};


var displayInfoStruct = {
  header:"Info",
  footer:"",
  maxColumn:0,
};

var displayCompassStruct = {
  header:"Compass",
  footer:"",
  heading:0,
  getModifiedHeading:0,
  maxColumn:0,
};


var m=0;
//m=g.getModified(); // save modified area for clearing on next drawString

// override drawString function to:
// - allocate proper line spacing between successive lines (here 5 pixels)
// - clear the area where the previous drawString was displayed
// 03-07-2020. Tested OK

g._ds = g.drawString;
g.drawString = function(s,x,y,fill) {
  s=s.toString();
  sa=s.split("\n");
  spacing=5+g.getFontHeight();

  g.getModified(true); // Reset modified area

  sa.forEach(function(line){    
    //call the original drawString
    g._ds(line,x,y,fill);
    y+=spacing;
  });    
  m=g.getModified(); // save modified area for clearing on next drawString
};

function fileToString(filename){
  var total="";
  f = Storage.open(filename,"r");
  var line = f.readLine();
  while (line!==undefined) {
    line=f.readLine();
    if(line !="") { if(line!=undefined) total += line; }
  }
  return(total);
}

// display a string central on the display
function central(text, y,fill) {
  g.drawString(text, (g.getWidth() - g.stringWidth(text))/2, y,fill);
}

function header(text){
  g.clear();
  g.setFontVector(20);
  g.setColor(1,1,0);  // yellow
  central(row +" " + text +"-" + column,0);
}

function footer(text){
  g.setFontVector(20);
  g.setColor(1,1,0);  // yellow
  central(text,215);
}

// display a string marquee to the right
function marquee(text,x,y){
  interval = setInterval(function () {
    g.clearRect(x,y,g.stringWidth(text),+g.getFontHeight()+5);
    g.drawString(text,x,y);
    x+=1;
    if(x > 239) x=-g.stringWidth(text);
  }, 20);
  return(interval);
}


function drawStringWrapped( str, x,y ) {
 
  sa=str.split(" ");
  out="";
  sa.forEach(function(word){
    // print(word);
    if( g.stringWidth(out + word + " ") > 239) out=out+"\n"+word+" ";
    else out+=word+" ";
  });
  g.drawString(out,x,y);
} 

setInterval(function () {
  console.log("Minute has passed");
  
  // if Home is displayed, update the variable part
  if(row+column == 0){ displayHome(false); }
  if(row == 5){ displayInfo(false); }

  nu= new Date();
  if( (nu.getHours() + nu.getMinutes) == 0 ){
    // it is midnight, set steps to ZERO.
    displayStepsStruct.steps=0;
  }  
}, 60000);


function lcdPowerEvent(on){
  if(on == true) {displayPage(false);}
  else{
    Bangle.setHRMPower(0);
    Bangle.setGPSPower(0);
    Bangle.setCompassPower(0);
  }
}

function displayHome(all){

  // if all=true display fixed AND variable part, if all=false display only variable part
  if(all == true){
    
    // header
    header(displayHomeStruct.header);

    // date
    g.setFontVector(22);
    g.setColor(1,0,0);
    central(clk.getDate().toString().substring(0,15),150);

  }

    g.clearRect(displayHomeStruct.getModifiedTime.x1, displayHomeStruct.getModifiedTime.y1, displayHomeStruct.getModifiedTime.x2, displayHomeStruct.getModifiedTime.y2); // Will clear the precise area affected by the previous drawString calls
    // display time
    g.setFontVector(65);   
    g.setColor(1,1,1);
    central(require('locale').time(new Date(),1),60);
    // remember area just displayed, for clearing next time
    displayHomeStruct.getModifiedTime = m;

  
    // clear previous temperature
    //g.clearRect(0, 200, 239, 239);
    g.clearRect(displayHomeStruct.getModifiedTemp.x1, displayHomeStruct.getModifiedTemp.y1, displayHomeStruct.getModifiedTemp.x2, displayHomeStruct.getModifiedTemp.y2); // Will clear the precise area affected by the previous drawString calls
    
  // display internal temperature and #steps
    g.setFontVector(15);   
    g.setColor(0,1,0);

    t=E.getTemperature();
    footer("Temp:"+t.toFixed(0) + " Steps:" + displayStepsStruct.steps);
    // displayStepsStruct.marqueeInterval=marquee("Temp:"+t + " " + "Steps:" + displayStepsStruct.steps,0,215);

    // remember area just displayed, for clearing next time
    displayHomeStruct.getModifiedTemp = m;

}

function displayInfo(all){
  
  // if all=true display fixed AND variable part, if all=false display only variable part
  if(all == true){

    // header
    header(displayInfoStruct.header);
    
    g.drawString("Temp:\nBattery:\nCharging:\nUptime:\nFlash:\nStorage:\n"+ NRF.getAddress(),0,25);
    
  }
  
  // remove old
  //g.clearRect(0, 60, 239, 239);
  
  g.setFontVector(20);
  g.setColor(0,1,0);  // green
  t=E.getTemperature();
  b=E.getBattery();
  u = (clk.getDate()-dateStart)/3600000;  // uptime in secs
  u=u.toFixed(2);  uMinuut=(u%60);
  if(Bangle.isCharging()) {c="Charging";} else {c="Not Charging";}
  sF=require("Flash").getFree().length;
  sS=require("Storage").getFree();


  if(Bangle.isCharging()) {c="Yes";} else {c="No";}
  
  
  g.drawString(t + "\n" + b + "%\n" + c + "\n" + u + " hr" + "\n" + sF + "\n" + sS,125,25);
}


function displayNews(){
  
  // header
  header(displayNewsStruct.header);

  g.setFontVector(15);
  g.setColor(0,1,0);  // green
  s=fileToString("news.txt");
  sa=s.split("\n");
  y=25;
  sa.forEach(function(line){
    // lines from NL teletekst are 35 chars long, so divide in 2 parts
    drawStringWrapped(line,0,y);
    y+=g.getFontHeight()+25;
    g.drawLine(0,y,239,y);
    y+=5;
  });
}

function displayWeather(all){
  
  // header
  header(displayWeatherStruct.header);

  if(column == 0){
    g.setFontVector(20);
    g.setColor(0,1,0);  // green
    weer0=fileToString("weer0.txt");
    sa=weer0.split("\n");
    print(sa);
    y=25;
    line=sa[1];
    print(line);
    lineSplit=line.split(",");
    print(lineSplit);

    // line 1 contains comma separated data
    lineSplit.forEach(function(item){
      g.drawString(item,150,y);
      y+=25;
    });
    g.drawString("Temp:\nHum:\nPressure\nWind:\nDirection:\n%clouds",0,25);

    footer("         >",20);
  } else
  if(column == 1){
    // this is a table, bitfont is better for keeping table aligned
    //g.setFontVector(15);
    g.setColor(0,1,0);  // green
    g.setFont("6x8",2);
    g.drawString(fileToString("weer1.txt"),0,25);
    footer("<         ",20);

  }
}


function displayStocks(all){

  // for testing in emulator only
  // stocks="#stocks,05-07-2020,18:46\nABN AMRO BANK,8.01,7.96,-0.57%\nADYEN NV,1338.00,1351.50,+1.01%\nAegon,2.73,2.71,-0.77%\n";

  
  stocks=fileToString("stocks.txt");

  if(all){
    // header
    header(displayStocksStruct.header);
  }
  
  // create array of stockLines (like ABN AMRO BANK,7.96,8.38,+5.33%)
  stocksLines=stocks.split("\n");
  
  // limit the number of subpages to # of line in stocksLines -3 (from column-0 page)
  displayStocksStruct.maxColumn=stocksLines.length-3;
  
  stockActive=stocksLines[column+1];

  stocksLinesParts=stockActive.split(",");
  
  g.setColor(0,1,0);
  g.setFontVector(40);
  central(stocksLinesParts[0].substring(0,5),25);

  g.setColor(1,1,0);
  g.setFontVector(40);
  central(stocksLinesParts[2],75);
  
  if(stocksLinesParts[3].startsWith("+")) g.setColor(0,1,0); else  g.setColor(1,0,0);
  g.setFontVector(30);
  central(stocksLinesParts[3],125);
  
  // display date and time of stock data
  // get string after the first comma = date + time from #stocks,06-07-2020,16:22
  commaIndex=stocksLines[0].indexOf(",");
  g.setFontVector(15);
  g.setColor(1,1,1);
  central(stocksLines[0].substring(1+commaIndex),165);
  
  if(column == 0) footer("             >");
  else if (column == displayStocksStruct.maxColumn) footer("<             ");
  else footer("<            >");

}

function displayMessages(){

  // header
  header(displayMessagesStruct.header);

  g.setFontVector(20);
  g.setColor(0,1,0);  // green
  
  
  s=fileToString("messages.txt");
  sa=s.split("\n");
  displayMessagesStruct.maxColumn=sa.length-1;
  
  if(column==0){
    g.drawString(fileToString("messages.txt"),0,25);
  } else{
    drawStringWrapped(sa[column-1],0,25);
  }
  
  if(column == 0) footer("             >");
  else if (column == displayMessagesStruct.maxColumn) footer("<             ");
  else footer("<            >");
}

function displayHeart(all){
  // set Power for HRM ON. Should be switched OFF when page is left

  Bangle.setHRMPower(1);

  // if all=true display fixed AND variable part, if all=false display only variable part
  if(all == true){
  
  // header
  header(displayHeartStruct.header);

// draw a red heart on the screen
	r=55;
	x1=120-r;
	y=100;
	x2=115+r;
	g.setColor(1,0,0);
    // 2 circles
    g.fillCircle(x1, y, r);
	g.fillCircle(x2, y, r);
	//g.setColor(1,1,0);
    // triangle
	g.fillPoly([x1-r*0.48,y+r*0.9, x2+r*0.52,y+r*0.9, 118,y+2*r], true);
    // fill the remaining gap
	//g.setColor(1,1,1);

    g.fillRect(90,120,150,150);

  }
  // display Bpm
  g.setFontVector(60);
  g.setColor(1,0,0);
  // remove old
  //g.clearRect(0, 70, 239, 150);
g.fillRect(displayHeartStruct.getModifiedBpm.x1,displayHeartStruct.getModifiedBpm.y1,displayHeartStruct.getModifiedBpm.x2,displayHeartStruct.getModifiedBpm.y2); // Will clear the precise area affected by the previous drawString calls
  g.setColor(1,1,1);
  central(displayHeartStruct.bpm,90,true);
  displayHeartStruct.getModifiedBpm=m;

}


function displaySteps(all){
  
  // if all=true display fixed AND variable part, if all=false display only variable part
  if(all == true){    

  // header
  header(displayStepsStruct.header);
    

    g.drawString("Distance:\nCalories:\nInactive:",0,150);
    
  }
  
    // remove old
    //g.clearRect(0, 50, 239, 220);
  
    g.clearRect(displayStepsStruct.getModifiedSteps.x1,displayStepsStruct.getModifiedSteps.y1,displayStepsStruct.getModifiedSteps.x2,displayStepsStruct.getModifiedSteps.y2); // Will clear the precise area affected by the previous drawString calls
  
    // display
  	g.setFontVector(80);
	g.setColor(1,0,0);
  
    steps=displayStepsStruct.steps;

  	central(steps,50);
    displayStepsStruct.getModifiedSteps=m;
  
 g.clearRect(displayStepsStruct.getModifiedStepsDetails.x1,displayStepsStruct.getModifiedStepsDetails.y1,displayStepsStruct.getModifiedStepsDetails.x2,displayStepsStruct.getModifiedStepsDetails.y2); // Will clear the precise area affected by the previous drawString calls
  
	g.setFontVector(20);
    g.setColor(0,1,0);  // green
    g.drawString(String((steps*0.0008).toFixed(2)) + " Km\n" + String((steps*0.04).toFixed(2))+"\nn.a.",120,150);
    displayStepsStruct.getModifiedStepsDetails = m;

}



function displayGps(all){
  // set Power for GPS ON. Should be switched OFF when page is left

  Bangle.setGPSPower(1);
  
  // if all=true display fixed AND variable part, if all=false display only variable part
  if(all == true){    

    // header
    header(displayGpsStruct.header);
    
    g.drawString("Fix\nLat\nLon\n#Sat\nSpeed\nCourse",0,25);
    
  }
  // remove old
  //g.clearRect(0, 70, 239, 239);
  
  
  
  // display GPS
  g.setFontVector(20);
  g.setColor(0,1,0);  // green
  // remove old
  //g.clearRect(0, 70, 239, 150);
g.clearRect(displayGpsStruct.getModifiedGpsDetails.x1,displayGpsStruct.getModifiedGpsDetails.y1,displayGpsStruct.getModifiedGpsDetails.x2,displayGpsStruct.getModifiedGpsDetails.y2); // Will clear the precise area affected by the previous drawString calls

  g.drawString(":" + lastGpsFix.fix + "\n:" + lastGpsFix.lat.toFixed(2) + "\n:" + lastGpsFix.lon.toFixed(2) + "\n:" + lastGpsFix.satellites + "\n:" + lastGpsFix.speed.toFixed(2) + "\n:" + lastGpsFix.course,80,25);
  
  displayGpsStruct.getModifiedGpsDetails=m;

  
}

function displayCompass(all){

  // set Power for Compass ON. Should be switched OFF when page is left
  Bangle.setCompassPower(true);

  
  // if all=true display fixed AND variable part, if all=false display only variable part
  if(all == true){    
    
    // header
    header(displayCompassStruct.header);    
  }
  
  // display Heading
  g.setFontVector(40);
  g.setColor(1,0,0);
  // remove old

g.clearRect(displayCompassStruct.getModifiedHeading.x1,displayCompassStruct.getModifiedHeading.y1,displayCompassStruct.getModifiedHeading.x2,displayCompassStruct.getModifiedHeading.y2); // Will clear the precise area affected by the previous drawString calls
  	central(displayCompassStruct.heading.toFixed(0),50);
  displayCompassStruct.getModifiedHeading=m;
  
    // remove old
    g.clearRect(60,100 , 180, 220);
  
    r=displayCompassStruct.heading*Math.PI/180;
    var p = Math.PI/2;
    g.setColor(1,0,0);
    g.drawLine(120,160,120+60*Math.sin(r), 160-60*Math.cos(r));
    g.setColor(1,1,1);
    g.drawLine(120,160,120-60*Math.sin(r), 160+60*Math.cos(r));

}

function displayPage(){

  // switch power to Hrm, GPS,Comapss if not in the coressponding page
  if(row!=6) Bangle.setHRMPower(0);
  if(row!=8) Bangle.setGPSPower(0);
  if(row!=9) Bangle.setCompassPower(0);


  if( row == 0){
    if(column >= displayHomeStruct.maxColumn) { column=displayHomeStruct.maxColumn; }
    displayHome(true);
  }
  if( row == 1){
    if(column >= displayNewsStruct.maxColumn) { column=displayNewsStruct.maxColumn; }
    displayNews(true);
  }
  if( row == 2){
    if(column >= displayWeatherStruct.maxColumn) column=displayWeatherStruct.maxColumn;
    displayWeather(true);
  }
  if( row == 3){
    if(column >= displayStocksStruct.maxColumn) column=displayStocksStruct.maxColumn;
    displayStocks(true);
  }
  if( row == 4){
    if(column >= displayMessagesStruct.maxColumn) column=displayMessagesStruct.maxColumn;
    displayMessages(true);
  }
  if( row == 5){
    if(column >= displayInfoStruct.maxColumn) column=displayInfoStruct.maxColumn;
    displayInfo(true);
  }
  if( row == 6){
    if(column >= displayHeartStruct.maxColumn) column=displayHeartStruct.maxColumn;
    displayHeart(true);
  }
   if( row == 7){
    if(column >= displayStepsStruct.maxColumn) column=displayStepsStruct.maxColumn;
    displaySteps(true);
  }
  if( row == 8){
    if(column >= displayGpsStruct.maxColumn) column=displayGpsStruct.maxColumn;
    displayGps(true);
  }
  if( row == 9){
    if(column >= displayCompassStruct.maxColumn) column=displayCompassStruct.maxColumn;
    displayCompass(true);
  }
}


let row=0;
let column=0;
let rowMax=9;


setWatch(function() {
  goingVertical=true;
  goinghorizontal=false;
  column=0;
  if (row < rowMax){
    row++;}
  else{
    row=0;
  }
  print("BTN1=UP row=", row, "column=",column);
  displayPage();
}, BTN1, {repeat:true,debounce:10});

setWatch(function() {
  if(digitalRead(BTN2)) {
  goingVertical=false;
  goinghorizontal=false;
  column=0;
  row=0;
  displayPage();
  }
}, BTN2, {repeat:true,debounce:10});

setWatch(function() {
  goingVertical=true;
  goinghorizontal=false;
  column=0;
  if (row > 0){
    row--;}
  else{
    row=rowMax;
  }
  print("BTN3=DOWN row=", row, "column=",column);
  displayPage();
}, BTN3, {repeat:true,debounce:10});

setWatch(function() {
  column++;
  print("BTN5=LEFT row=", row, "column=",column);
  displayPage();
}, BTN5, {repeat:true,debounce:10});

setWatch(function() {
  if(column > 0) column--;
  print("BTN4=RIGHT row=", row, "column=",column);
  displayPage();
}, BTN4, {repeat:true,debounce:10});

/*
Bangle.on('swipe', function(direction) {
  if(direction == -1){
    goingVertical=false;
    goinghorizontal=true;
    if (column < columnMax){
      column++;}
    else{
      column=0;
    }
    print("SWIPE LEFT row=", row, "column=",column);
  if(direction == -1){
    goingVertical=true;
    goinghorizontal=false;
    if (column > 0){
      column--;}
    else{
      column=columnMax;
    }
    print("SWIPE RIGHT row=", row, "column=",column);
    }
  }
    displayPage();
});
*/


// main

// save start dat/time to calculate uptime (see displayInfo)
  dateStart=clk.getDate();

// setup handlers for events to display variable parts of the page

Bangle.on('lcdPower', function(on) { lcdPowerEvent(on); });

Bangle.on('GPS', function(fix){ lastGpsFix=fix; if(row==8)displayGps(false); });

Bangle.on('step', function(up){ displayStepsStruct.steps=up; if(row==7)displaySteps(false); });

Bangle.on('mag', function(up){ displayCompassStruct.heading=up.heading; print(displayCompassStruct.heading); if(row==9) displayCompass(false); });

Bangle.on('HRM', function(hrm){ displayHeartStruct.bpm=hrm.bpm; if(row==6)displayHeart(false); });

Bangle.setLCDTimeout(10);

displayPage();
