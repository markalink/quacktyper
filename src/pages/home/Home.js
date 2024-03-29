/*
short term:
-load next quote while typing current quote
-implement more efficient rendering solution: render only changes on key press not whole quote
  -hackish solution render indices in range from between spaces to get around control backspace
  -or just determine how far ctrl backspace will go back in given instance
-save race history using localstorage
-use quotable.io api in case rapidapi fails
-render quote author?
-show "press enter to skip quote" if stop typing for two seconds
-get a better logo icon
-implement penalty for incorrect words on quote end

long term:
  -generate custom link for typeracer 1v1
  -create account system?
  -different themes
  -select quote category
  -clean up code, seperate into legible components
  -render graphs
  -explore animations
  -settings menu
    -select font/fontsize
    -theme
*/
import { useEffect, useRef, useState } from 'react';
import './Home.css';

let quoteString = "";
let inputValue = "";
let mistakeCount;
let prevIncorrectChars;
let correctChars;
let incorrectChars;
//let currentIndex = 0; for single character update implementation
let timerStarted = false;
let currentTime = 1;
let startTime;
let testResults = [];
let newBest = false
let isSpaceDoublePressed = false;
let isFirstTest = true;

function Home() {
  const [rerender, setRerender] = useState(false);
  const [quote, setQuote] = useState([])
  const [accuracy, setAccuracy] = useState(0)
  const [best, setBest] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [avgWpm, setAvgWpm] = useState(0)
  const inputRef = useRef(null)

  const [isFinished, setIsFinished] = useState(false)
  const [isInputChecked, setIsInputChecked] = useState(true)
  const [isCardChecked, setIsCardChecked] = useState(false)
  const [isUnderlineChecked, setIsUnderlineChecked] = useState(true)

  function Letter(value, style) {
    this.value = value;
    this.style = style;
  }
  function Word(index, letters) {
    this.index = index
    this.letters = letters
  }

  const QUOTE_API = "https://quotable.io/random?minLength=150";

  //paid/freemium
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'b32f355065mshc55d21de4f377bcp144c30jsn70d79e6785a3',
      'X-RapidAPI-Host': 'famous-quotes4.p.rapidapi.com'
    }
  }; 
  //This one is better and free: https://rapidapi.com/martin.svoboda/api/quotes15/pricing

  // const options = {
  //   method: 'GET',
  //   headers: {
  //     'X-RapidAPI-Key': 'b32f355065mshc55d21de4f377bcp144c30jsn70d79e6785a3',
  //     'X-RapidAPI-Host': 'quotes15.p.rapidapi.com'
  //   }
  // };
  
  

  const fetchQuote = async () => { //should pull quotes off of keyhero
    return fetch(QUOTE_API).then(response => response.json()).then(data => data.content)

    //paid/freemium
    // return fetch('https://famous-quotes4.p.rapidapi.com/random?category=all&count=1', options)
    // .then(response => response.json())
    // .then(response => response[0].text)

    //free multilanguge
    // return fetch('https://quotes15.p.rapidapi.com/quotes/random/', options)
    // .then(response => response.json())
    // .then(response => response.content)
    // .catch(err => console.error(err));

  }

  useEffect(() => {
    newQuote()
    setRerender(old => !old)
    //eslint-disable-next-line
  }, [])

  useEffect(() => {
    quote.length && renderQuote()
    // eslint-disable-next-line
  }, [isUnderlineChecked])


  const newQuote = async () => {
    let tempQuote = [];
    quoteString = await fetchQuote();
    quoteString = quoteString.replace("—", "-")
    // quoteString = "some test."
    const wordArray = quoteString.split(" ")
    let wordLetters = []
    let wordIndex = 0;

    for (let i = 0; i < wordArray.length; i++) {
      //eslint-disable-next-line
      wordArray[i].split("").map(char => wordLetters.push(new Letter(char, { ...styles.default, textDecoration: isUnderlineChecked && i === 0 ? "underline" : "none" })))
      wordLetters.push(new Letter(" ", styles.default))
      tempQuote.push(new Word(wordIndex, wordLetters))
      wordIndex += wordLetters.length
      wordLetters = []
    }
    tempQuote[tempQuote.length - 1].letters.splice(-1, 1)
    setQuote(tempQuote);
    // currentIndex = 0; for single character update implementation

    stopTimer()
    inputRef.current.value = ""
    inputValue = ""
    currentTime = 1
    correctChars = 0
    mistakeCount = 0
    prevIncorrectChars = 0
    newBest = false
    timerStarted = false
    setIsFinished(false)
    setRerender(old => !old)
  }

  const [intervalId, setIntervalId] = useState()

  const startTimer = () => {
    isFirstTest = false
    startTime = new Date()
    setIntervalId(setInterval(() => {
      console.log("timer running")
      currentTime = (new Date() - startTime) / 1000
      updateStats()
    }, 500)
    )
  }
  
  const stopTimer = () => {
    clearInterval(intervalId)
    console.log("timer stopped")
  }
  
  const updateStats = () => {
    console.log("correct:", correctChars)
    setWpm(correctChars / 5 / currentTime * 60)
    correctChars + incorrectChars + mistakeCount === 0 ?
    setAccuracy(0)
    : setAccuracy((correctChars) / (correctChars + incorrectChars + mistakeCount) * 100)
  }

  const terminators = [".", "!", "?"]

  const handleChange = (event) => { //check to see if change is enter character, if it is stop timer.
    inputValue = event.target.value;
    let length = inputValue.length;
    if (terminators.includes(inputValue[length - 3]) && inputValue[length - 2] === " " && inputValue[length - 1] === " " && !isSpaceDoublePressed) {
      isSpaceDoublePressed = true
      inputValue = inputValue.slice(0, -1)
      inputRef.current.value = inputValue
    }
    else {
      isSpaceDoublePressed = false
      renderQuote()
    }
  }

  const renderQuote = () => {
    correctChars = 0;
    incorrectChars = 0;
    let tempQuote = quote;

    for (let i = 0; i < quoteString.length; i++) {
      if (i > inputValue.length - 1) {
        tempQuote = changeLetterStyle(i, styles.default, tempQuote)
      }
      else if (quoteString[i] === inputValue[i]) {
        tempQuote = changeLetterStyle(i, styles.correct, tempQuote)
        correctChars += 1
      }
      else {
        tempQuote = changeLetterStyle(i, styles.incorrect, tempQuote)
        incorrectChars += 1
      }
    }
    !isFinished && setQuote(tempQuote)
    if (incorrectChars > prevIncorrectChars) {
      mistakeCount += incorrectChars - prevIncorrectChars;
    }
    prevIncorrectChars = incorrectChars
    updateStats()
    checkIsFinished()
    isUnderlineChecked && quote.length && !isFinished && underlineCurrentWord()
    timerStarted && !isFinished && (currentTime = (new Date() - startTime) / 1000)
    setRerender(old => !old)
  }

  const changeLetterStyle = (index, style, quote) => {
    if (quoteString.length === 0 || index > quoteString.length - 1 || isFinished) {
      return quote;
    }
    let tempQuote = quote;
    for (let i = 0; i < tempQuote.length; i++) {
      if (tempQuote[i].index > index) {
        tempQuote[i - 1].letters[index - tempQuote[i - 1].index].style = style
        return tempQuote;
      }
    }
    (tempQuote[tempQuote.length - 1].letters[index - tempQuote[tempQuote.length - 1].index].style = style)
    return tempQuote
  }

  const underlineCurrentWord = async () => {
    let isCorrect = true
    let index = -1;
    let tempQuote = quote

    quote.every((Word, i) => {
      if (Word.index > inputValue.length) {
        index = i - 1
        return false;
      }
      return true;
    })
    index === -1 && (index = tempQuote.length - 1)
    inputValue.length === 0 && (index = 0)
    tempQuote[index].letters.forEach((Letter, i) => {
      if (inputValue.length > tempQuote[index].index + i && Letter.value !== inputValue[tempQuote[index].index + i]) {
        isCorrect = false
      }
    })
    tempQuote[index].letters.forEach((Letter, i) => {
      if (i !== tempQuote[index].letters.length - 1 || index === tempQuote.length - 1) {
        Letter.style = { ...Letter.style, textDecoration: isCorrect ? "underline" : "underline #e62020" }
      }
    })
    setQuote(tempQuote)
  }

  let finalWpm
  const checkIsFinished = async () => {
    if (quoteString.length !== 0 && inputValue.length === quoteString.length && inputValue[quoteString.length - 1] === quoteString[quoteString.length - 1] && !isFinished) {
      setIsFinished(true)
      finalWpm = correctChars / 5 / currentTime * 60
      setWpm(finalWpm)
      stopTimer()
      testResults.push(finalWpm)
      let sum = 0
      testResults.forEach((wpm) => sum += wpm)
      setAvgWpm(testResults.length === 0 ? 0 : sum / testResults.length)
      if (finalWpm > best) {
        newBest = true
        setBest(finalWpm)
      }
    }
  }

  const handleKeyDown = (event) => {
    if (ignoreKeys.includes(event.key)) {
      return;
    }
    if (!timerStarted && currentTime === 1) {
      startTimer();
      timerStarted = true;
    }
    if (event.key === "Enter") {
      newQuote()
      stopTimer()
    }
    //only changes the letter pressed, problem with ctrl backspace not working
    // else if (event.key === "Backspace") {
    //   if (currentIndex > 0) {
    //     currentIndex -= 1;
    //     changeLetterStyle(currentIndex, styles.default)
    //   }
    // }
    // else {
    //   if (event.key === quoteString[currentIndex]) {
    //     changeLetterStyle(currentIndex, styles.correct)
    //   }
    //   else {
    //     changeLetterStyle(currentIndex, styles.incorrect)
    //   }
    //   currentIndex += 1;
    // }
    // setRenderText(old => !old)
  }

  return (
    <div className="App">

      <div className="Header">
        <h1 className="Title">Quack Typer</h1>
        <div className="StatsContainer">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div>
              <span>Best: </span>
              <span style={{ color: newBest && "#4CBB17" }}>{best.toFixed(2)}</span>
            </div>
            <span>Avg: {avgWpm.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ ...styles.default, fontSize: "22px", marginTop: "-2%", marginBottom: "2%", flexDirection: "row" }}>
        <span>Wpm: {wpm.toFixed(2)} Accuracy: </span>
        <span style={{color: accuracy === 100 && "#4CBB17"}}>{accuracy.toFixed(2)}</span>
        <span>%</span>
      </div>
      
      <div className="Card" style={{ boxShadow: isCardChecked && "0px 0px 15px black", backgroundColor: isCardChecked && "#282b30" }}>
        {quote && quote?.map((Word, i) => {
          return (
            <div className="Word" key={i * 10 + 5}>
              {
                Word.letters.map((Letter, i) => {
                  if (Letter.value === " ") {
                    return (
                      <span className="Letter" key={i * 10} style={Letter.style === styles.incorrect ? { ...Letter.style, textDecoration: "underline", marginTop: "25px" } : { ...styles.correct, opacity: "0" }}>&nbsp;</span>
                    )
                  }
                  else {
                    return (
                      <p className="Letter" key={i * 10} style={Letter.style}>{Letter.value}</p>
                    )
                  }
                })
              }
            </div>
          )
        })
        }
      </div>

      <input className="Input" style={{ opacity: isInputChecked ? "1" : "0" }} ref={inputRef} onBlur={() => inputRef.current.focus()} type="text" spellCheck="false" autoFocus onKeyDown={(event) => handleKeyDown(event)} onChange={(event) => handleChange(event)}></input>
      <span style={{ ...styles.default, fontSize: "22px", marginTop: "1%", opacity: isFinished || isFirstTest ? ".5" : "0" }} >Press Enter to {isFirstTest ? "Skip" : "Continue"}...</span>

      <div className="Settings">
        <div className='ToggleContainer'>
          <span style={{ ...styles.default, fontSize: "14px" }}>Underline Word&nbsp;&nbsp;</span>
          <input className="Checkbox" type="checkbox" defaultChecked={isUnderlineChecked} onClick={() => { setIsUnderlineChecked(old => !old) }} />
        </div>
        <div className='ToggleContainer'>
          <span style={{ ...styles.default, fontSize: "14px" }}>Toggle Card&nbsp;&nbsp;</span>
          <input className="Checkbox" type="checkbox" defaultChecked={isCardChecked} onClick={() => { setIsCardChecked(old => !old) }} />
        </div>

        <div className="ToggleContainer">
          <span style={{ ...styles.default, fontSize: "14px" }}>Toggle Input&nbsp;</span>
          <input className="Checkbox" type="checkbox" defaultChecked={isInputChecked} onClick={() => { setIsInputChecked(old => !old) }} />
        </div>
      </div>

      <span style={{ opacity: "0" }}>{rerender}</span>
    </div>
  );
}

const textStyle = {
  fontSize: "25px",
  fontFamily: "Roboto Mono",
}
const styles = {
  default: { ...textStyle, color: "#99aab5" },
  correct: { ...textStyle, color: "#4CBB17" },
  incorrect: { ...textStyle, color: "#e62020" },
}
const ignoreKeys = [
  "Shift",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Alt",
  "Control",
]
export default Home;
