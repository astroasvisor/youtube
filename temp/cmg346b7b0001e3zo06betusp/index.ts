
import { registerRoot } from "remotion"
import { QuizVideo } from "./src/remotion/compositions/QuizVideo"

// Questions data with proper typing
const questions = [{"id":"cmg23zfc1000de32c59dvupn6","text":"What do moving a magnet into a coil and rotating a coil near a magnet have in common?","optionA":"They both generate heat","optionB":"They both produce light","optionC":"They both create sound","optionD":"They both induce currents","correctAnswer":"D","explanation":"Both actions induce currents through electromagnetic induction, showcasing Faraday's law!"}]
const title = "Class 12 Physics | Electromagnetic Induction Quiz #830"

// Register the QuizVideo component directly with the questions data
registerRoot(() => QuizVideo({ questions, title }))
