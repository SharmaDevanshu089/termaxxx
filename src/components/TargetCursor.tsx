import React, { useEffect, useRef, useState } from 'react';
import './TargetCursor.css';

export interface TargetCursorProps {
  targetSelector?: string;
  hideDefaultCursor?: boolean;
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = '.cursor-target',
  hideDefaultCursor = true
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [activeTarget, setActiveTarget] = useState<Element | null>(null);

  // Check if we are on a mobile device to disable custom cursor
  const isMobile = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    return hasTouchScreen && isSmallScreen;
  }, []);

  // Set up mouse events to hide browser cursor and track position
  useEffect(() => {
    if (isMobile) return;

    const originalCursor = document.body.style.cursor;
    const originalHtmlCursor = document.documentElement.style.cursor;

    if (hideDefaultCursor) {
      document.body.style.cursor = 'none';
      document.body.classList.add('custom-cursor-active');
      document.documentElement.style.cursor = 'none';
      document.documentElement.classList.add('custom-cursor-active');
    }

    return () => {
      document.body.style.cursor = originalCursor;
      document.body.classList.remove('custom-cursor-active');
      document.documentElement.style.cursor = originalHtmlCursor;
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [hideDefaultCursor, isMobile]);

  // Track the hovered target selector elements
  useEffect(() => {
    if (isMobile) return;

    const enterHandler = (e: MouseEvent) => {
      const directTarget = e.target as Element;
      const allTargets: Element[] = [];
      let current: Element | null = directTarget;
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }
      const target = allTargets[0] || null;
      if (target) {
        setActiveTarget(target);
      }
    };

    const leaveHandler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target && target.matches(targetSelector)) {
        setActiveTarget(null);
      }
    };

    window.addEventListener('mouseover', enterHandler, { passive: true });
    window.addEventListener('mouseout', leaveHandler, { passive: true });

    return () => {
      window.removeEventListener('mouseover', enterHandler);
      window.removeEventListener('mouseout', leaveHandler);
    };
  }, [targetSelector, isMobile]);

  // Track the mouse coordinates and update DOM positioning
  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const cursor = cursorRef.current;
    let mouseX = 0;
    let mouseY = 0;

    const mouseMoveHandler = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      if (!activeTarget) {
        // Idle text caret position
        cursor.style.width = '2px';
        cursor.style.height = '18px';
        cursor.style.borderRadius = '1px';
        cursor.style.backgroundColor = 'var(--accent-blue)';
        cursor.style.border = 'none';
        cursor.style.transform = `translate3d(${mouseX - 1}px, ${mouseY - 9}px, 0)`;
      }
    };

    window.addEventListener('mousemove', mouseMoveHandler, { passive: true });

    return () => {
      window.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, [activeTarget, isMobile]);

  // Handle snapping layout bounds adjustments
  useEffect(() => {
    if (isMobile || !cursorRef.current || !activeTarget) return;

    const cursor = cursorRef.current;
    
    const updateSnapping = () => {
      if (!activeTarget) return;
      const rect = activeTarget.getBoundingClientRect();
      const padding = 4;
      cursor.style.width = `${rect.width + padding * 2}px`;
      cursor.style.height = `${rect.height + padding * 2}px`;
      cursor.style.borderRadius = '6px';
      cursor.style.backgroundColor = 'transparent';
      cursor.style.border = '2px solid var(--accent-blue)';
      cursor.style.transform = `translate3d(${rect.left - padding}px, ${rect.top - padding}px, 0)`;
    };

    // Run immediately and update on scroll/resize
    updateSnapping();
    window.addEventListener('scroll', updateSnapping, { passive: true });
    window.addEventListener('resize', updateSnapping, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateSnapping);
      window.removeEventListener('resize', updateSnapping);
    };
  }, [activeTarget, isMobile]);

  if (isMobile) return null;

  return <div ref={cursorRef} className="simple-target-cursor" />;
};

export default TargetCursor;
