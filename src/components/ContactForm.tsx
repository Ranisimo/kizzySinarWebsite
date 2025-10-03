import React from 'react';
import { useForm, ValidationError } from '@formspree/react';

function ContactForm() {
  const [state, handleSubmit] = useForm("mdkwzjyr");
  
  if (state.succeeded) {
      return <div className="row">Thanks for your message!</div>;
  }
  return (
    <form
        name="contact-form"
        id="contact-form"
        onSubmit={handleSubmit}
    >
        <div className="row">
        <div className="col-lg-6">
            <div className="form-group mt-2 mb-3">
            <label htmlFor="name" className="fw-bold mb-2">
                Name
            </label>
            <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="Your name..."
                required
            />
            </div>
            <ValidationError prefix="Name" field="name" errors={state.errors} />
        </div>
        <div className="col-lg-6">
            <div className="form-group mt-2 mb-3">
            <label htmlFor="email" className="fw-bold mb-2">
                Email address
            </label>
            <input 
                id="email" 
                name="email"
                type="email" 
                className="form-control"
                placeholder="Your email..." 
                required
            />
            <ValidationError prefix="Email" field="email" errors={state.errors} />
            </div>
        </div>
        <div className="col-lg-12">
            <div className="form-group mt-2 mb-3">
            <label htmlFor="subject" className="fw-bold mb-2">
                Subject
            </label>
            <input
                id="subject"
                name="subject"
                type="text"
                className="form-control"
                placeholder="Your Subject.."
            />
            <ValidationError prefix="Subject" field="subject" errors={state.errors} />
            </div>
        </div>
        </div>
        <div className="row">
        <div className="col-lg-12">
            <div className="form-group mt-2 mb-3">
            <label htmlFor="messsage" className="fw-bold mb-2">
                Message
            </label>
            <textarea
                id="messsage"
                name="messsage"
                rows={4}
                className="form-control"
                placeholder="Your message..."
            ></textarea>
            <ValidationError prefix="Message" field="message" errors={state.errors} />
            </div>
        </div>
        </div>
        <div className="row">
        <div className="col-sm-12 text-right">
            <button 
            id="submit"
            name="send"
            type="submit" 
            disabled={state.submitting}
            className="submitBnt btn btn-custom"
            >
            Send Message
            </button>
            <ValidationError errors={state.errors} />
        </div>
        </div>
    </form>
  );
}

export default ContactForm;