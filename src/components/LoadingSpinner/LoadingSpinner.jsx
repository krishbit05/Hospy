import "./LoadingSpinner.css"

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
