import React, { useRef } from 'react';
import useRevealOnScroll from '../hooks/useRevealOnScroll';

const RevealOnScroll = ({
  as: Component = 'div',
  className = '',
  children,
  rootMargin,
  threshold,
  ...props
}) => {
  const ref = useRef(null);
  useRevealOnScroll(ref, { rootMargin, threshold });

  return (
    <Component ref={ref} className={className} {...props}>
      {children}
    </Component>
  );
};

export default RevealOnScroll;
