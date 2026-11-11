import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

export function Reveal({ children, className = '', delay = 0, ...props }) {
  const reduce = useReducedMotion();
  return <motion.div initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-35px' }} transition={{ duration: 0.65, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }} className={className} {...props}>{children}</motion.div>;
}

export function Eyebrow({ children, className = '' }) {
  return <p className={`eyebrow ${className}`}><span aria-hidden="true" />{children}</p>;
}

export function Brand({ className = '' }) {
  return <a href="#home" className={`brand ${className}`} aria-label="Wayfinder home"><span className="brand-bars" aria-hidden="true"><i /><i /><i /></span><span><strong>WAYFINDER</strong><small>NORTHSTAR UNIVERSITY</small></span></a>;
}

export function Modal({ title, children, onClose, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return createPortal(<dialog ref={ref} className={`site-modal ${className}`} aria-labelledby="modal-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <div className="modal-header"><h2 id="modal-title">{title}</h2><button onClick={onClose} className="icon-button" aria-label="Close dialog" autoFocus><X size={22} /></button></div>
    {children}
  </dialog>, document.body);
}
