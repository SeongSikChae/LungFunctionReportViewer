import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import App from "@/App"
import { store } from "@/store"
import "@/index.css"

ReactDOM.render(
  <Provider store={store as any}>
    <App />
  </Provider>,
  document.getElementById("root")
)
