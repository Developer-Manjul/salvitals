import { waChat } from "../js/site";

export default function FloatingUI() {
  return (
    <>
      <button
        className="fab"
        onClick={() => waChat()}
        aria-label="Chat on WhatsApp"
        type="button"
      >
        <svg
          className="i i-26"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M20.52 3.48A11.83 11.83 0 0 0 12.06 0
            C5.53 0 .22 5.31.22 11.84c0 2.09.55 4.13
            1.6 5.94L.12 24l6.37-1.67a11.82 11.82 0 0 0
            5.57 1.41h.01c6.52 0 11.83-5.31 11.83-11.84
            0-3.16-1.23-6.13-3.38-8.42Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />

          <path
            d="M8.6 6.9c-.22-.49-.46-.5-.67-.51
            -.17-.01-.36-.01-.55-.01-.19 0-.5.07-.76.36
            -.26.29-.99.97-.99 2.36s1.02 2.74 1.16 2.93
            c.14.2 1.97 3.15 4.84 4.29 2.39.95 2.88.76
            3.4.71.52-.05 1.68-.68 1.92-1.34.24-.66.24-1.22
            .17-1.34-.07-.12-.26-.19-.55-.33-.29-.14-1.68-.83
            -1.94-.92-.26-.1-.45-.14-.64.14-.19.29-.73.92-.9
            1.11-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.33-1.44
            -.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.44.13-.58
            .13-.13.29-.33.43-.5.14-.17.19-.29.29-.48
            .1-.19.05-.36-.02-.5-.07-.14-.63-1.54-.87-2.01Z"
            fill="currentColor"
          />
        </svg>

        <span>Chat with us</span>
      </button>

      <div id="toasts"></div>
      <div id="modalHost"></div>
    </>
  );
}