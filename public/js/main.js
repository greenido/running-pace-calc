calcPace();

loadEventListeners();

//
//
//
function loadEventListeners(){
  document.getElementById('hourSlide').addEventListener('input', calcPace);
  document.getElementById('minuteSlide').addEventListener('input', calcPace);
  document.getElementById('secondSlide').addEventListener('input', calcPace);
  document.getElementById('distanceRadioFields').addEventListener('click', calcPace);
}

//
//
//
function calcPace() {
  
  function getRaceDistance() {
    let radios = document.getElementsByName('distance');
    let val;
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].type === 'radio' && radios[i].checked) {
          // get value, set checked flag or do whatever you need to
          val = radios[i].value;
        }
      }
    return val; // return value of checked radio or undefined if none checked
    }
  
  //
  //
  //
  function getHours() {
    let myValue = document.getElementById('hourSlide').value;
    document.getElementById('hourSliderValue').innerHTML = myValue;
    return parseFloat(myValue*60);
  }

  //
  //
  //
  function getMinutes() {
    let myValue = document.getElementById('minuteSlide').value;
    if(myValue >= 10){
        document.getElementById('minuteSliderValue').innerHTML = myValue;
      } else if(myValue <= 9) {
        document.getElementById('minuteSliderValue').innerHTML = '0' + myValue;
      }
    return parseFloat(myValue);
  }

  //
  //
  //  
  function getSeconds() {
    let myValue = document.getElementById('secondSlide').value;
    if(myValue >= 10){
        document.getElementById('secondSliderValue').innerHTML = myValue;
      } else if(myValue <= 9) {
        document.getElementById('secondSliderValue').innerHTML = '0' + myValue;
      }
    return parseFloat(myValue / 60);
  }

  //
  //
  //
  let totalMinutes = getHours() + getMinutes() + getSeconds();
  let justSecondsMile = Math.round(((totalMinutes % getRaceDistance())/getRaceDistance())*60);
  let wholeMinuteMile = Math.round((totalMinutes / getRaceDistance()) - ((totalMinutes % getRaceDistance())/getRaceDistance()));

  //console.log("* totalMinutes: " + totalMinutes + " | justSecMile: " + 
  //            justSecondsMile + " | wholeMinuteMile: " +  wholeMinuteMile); 
  
  //
  //
  //
  function justSecondsFormatted(justSeconds) {
    if (justSeconds > 9 ){
      return justSeconds;
    }else if (justSeconds < 10 ) {
      return '0' + justSeconds;
    }
  };

  //
  //
  //
  function finalPace(justSeconds, wholeMinute){
    if (justSecondsFormatted(justSeconds) == 60) {
      let setPace = wholeMinute + 1 + ':00';
      return setPace;
    }else {
      let setPace = wholeMinute + ':' + justSecondsFormatted(justSeconds);
      return setPace;
    }
  }

  //
  // convert min/mile to min/km --> 0.62137119223733
  //
  function finalPaceKm(){
   let seconds = ((wholeMinuteMile * 60) + justSecondsMile) * 0.62137119223733;
   //console.log("▶️▶️ Seconds totals: "+seconds);
   let minutes = Math.trunc(seconds/60);
   let secondsLeft = Math.trunc(seconds % 60);
   let pace = finalPace(secondsLeft, minutes);
   return pace; 
  }


  document.getElementById('PaceValue').innerHTML = finalPace(justSecondsMile, wholeMinuteMile) + '<span> Min/Mi</span>';
  document.getElementById('PaceValue-km').innerHTML = finalPaceKm() + '<span> Min/Km</span>';


}
