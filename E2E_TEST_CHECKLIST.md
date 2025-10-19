# NeuroBridge E2E Testing Checklist

## Test Environment Setup
- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:5173
- [ ] At least one LLM adapter configured and available
- [ ] Browser DevTools open for monitoring

## 1. Complete Translation Flow Tests

### 1.1 Basic Translation (ASD → NT)
- [ ] Open application in browser
- [ ] Select "ASD" role
- [ ] Enter text: "I don't understand why you're upset. This doesn't make logical sense."
- [ ] Click "Translate" button
- [ ] Verify loading state appears
- [ ] Verify results display within 3 seconds
- [ ] Check all four sections appear:
  - [ ] Intent Analysis
  - [ ] Potential Misunderstanding
  - [ ] Improved Version
  - [ ] Emotion Meter
- [ ] Verify emotion intensity is between 0-100
- [ ] Verify text can be copied from result sections

### 1.2 Translation (NT → ASD)
- [ ] Select "NT" role
- [ ] Enter text: "I'm feeling a bit overwhelmed, could we talk later?"
- [ ] Click "Translate" button
- [ ] Verify results appear correctly
- [ ] Check that rewrite is appropriate for ASD audience

### 1.3 Uncertain Role Translation
- [ ] Select "Uncertain" role
- [ ] Enter text: "This is really frustrating!"
- [ ] Click "Translate" button
- [ ] Verify system handles uncertain role appropriately

### 1.4 High Emotion Text
- [ ] Enter text with high emotional intensity
- [ ] Verify emotion meter shows high value (>70)
- [ ] Check that communication tips appear when emotion > 70
- [ ] Verify emotion description is appropriate

### 1.5 Neutral Text
- [ ] Enter neutral text: "I need help with this task."
- [ ] Verify emotion meter shows low value (<30)
- [ ] Check that results are still meaningful

## 2. Tone Adjustment Tests

### 2.1 Direct Tone
- [ ] After getting translation result, click "Direct" tone button
- [ ] Verify loading state appears
- [ ] Verify adjusted text appears within 2 seconds
- [ ] Check that tone is more direct/clear
- [ ] Verify original meaning is preserved

### 2.2 Gentle Tone
- [ ] Click "Gentle" tone button
- [ ] Verify adjusted text is softer/warmer
- [ ] Check response time < 2 seconds

### 2.3 Empathetic Tone
- [ ] Click "Empathetic" tone button
- [ ] Verify adjusted text shows more empathy
- [ ] Check response time < 2 seconds

### 2.4 Multiple Tone Adjustments
- [ ] Try switching between different tones multiple times
- [ ] Verify each adjustment works correctly
- [ ] Check that UI updates properly

## 3. History Panel Tests

### 3.1 History Saving
- [ ] Complete a translation
- [ ] Open History Panel (right sidebar)
- [ ] Verify translation appears in history
- [ ] Check timestamp is correct
- [ ] Verify preview text is shown

### 3.2 View History Item
- [ ] Click on a history item
- [ ] Verify the translation result is restored
- [ ] Check all fields are populated correctly

### 3.3 Delete Single History Item
- [ ] Click delete button on a history item
- [ ] Verify item is removed from list
- [ ] Check localStorage is updated

### 3.4 Clear All History
- [ ] Add multiple translations to history
- [ ] Click "Clear All" button
- [ ] Verify confirmation prompt appears
- [ ] Confirm deletion
- [ ] Verify all history is cleared

### 3.5 History Limit (10 items)
- [ ] Add more than 10 translations
- [ ] Verify only the most recent 10 are kept
- [ ] Check oldest items are removed automatically

### 3.6 History Persistence
- [ ] Add items to history
- [ ] Refresh the page
- [ ] Verify history items persist after reload

## 4. Privacy Notice Tests

### 4.1 First Visit Modal
- [ ] Clear browser localStorage
- [ ] Reload the page
- [ ] Verify privacy notice modal appears
- [ ] Check that modal blocks interaction with main app
- [ ] Verify modal content includes:
  - [ ] Privacy statement
  - [ ] Medical disclaimer
  - [ ] Data handling explanation

### 4.2 Accept Privacy Notice
- [ ] Click "Accept" button
- [ ] Verify modal closes
- [ ] Check that app becomes interactive
- [ ] Verify acceptance is saved to localStorage

### 4.3 Privacy Settings Access
- [ ] Click settings icon (⚙️) in header
- [ ] Verify privacy notice opens
- [ ] Check all information is displayed

### 4.4 Clear All Data
- [ ] Open privacy settings
- [ ] Click "Clear All Data" button
- [ ] Verify confirmation prompt
- [ ] Confirm deletion
- [ ] Check that:
  - [ ] History is cleared
  - [ ] Privacy acceptance is reset
  - [ ] User role is reset
  - [ ] Input text is cleared

## 5. Error Handling Tests

### 5.1 Empty Input Error
- [ ] Leave input field empty
- [ ] Click "Translate" button
- [ ] Verify friendly error message appears
- [ ] Check that error is dismissible

### 5.2 Network Error Simulation
- [ ] Stop backend server
- [ ] Try to translate text
- [ ] Verify network error message appears
- [ ] Check that retry option is available
- [ ] Restart backend and retry
- [ ] Verify translation works after retry

### 5.3 API Timeout Handling
- [ ] (If possible) Simulate slow API response
- [ ] Verify timeout message appears after 10 seconds
- [ ] Check that user can retry

### 5.4 Invalid Input Handling
- [ ] Enter extremely long text (>2000 characters)
- [ ] Verify character count warning
- [ ] Check that system handles gracefully

### 5.5 Error Recovery
- [ ] Trigger an error
- [ ] Clear the error
- [ ] Perform successful translation
- [ ] Verify app returns to normal state

## 6. Mobile Responsive Tests

### 6.1 Mobile Layout (375px width)
- [ ] Resize browser to mobile width
- [ ] Verify layout adapts correctly
- [ ] Check that all elements are accessible
- [ ] Verify no horizontal scrolling
- [ ] Test role selector on mobile
- [ ] Test input card on mobile
- [ ] Test result card on mobile

### 6.2 Tablet Layout (768px width)
- [ ] Resize to tablet width
- [ ] Verify layout is appropriate
- [ ] Check sidebar behavior

### 6.3 Desktop Layout (1024px+ width)
- [ ] Verify two-column layout
- [ ] Check that sidebar is visible
- [ ] Verify proper spacing

### 6.4 Touch Interactions
- [ ] Test on actual mobile device or use DevTools touch emulation
- [ ] Verify buttons are easily tappable
- [ ] Check that text selection works
- [ ] Test scrolling behavior

## 7. Loading States and Animations

### 7.1 Translation Loading
- [ ] Start translation
- [ ] Verify loading spinner appears
- [ ] Check loading message is clear
- [ ] Verify UI is disabled during loading

### 7.2 Tone Adjustment Loading
- [ ] Start tone adjustment
- [ ] Verify loading indicator appears
- [ ] Check that button shows loading state

### 7.3 Smooth Transitions
- [ ] Observe result card appearance
- [ ] Check for smooth fade-in animations
- [ ] Verify emotion meter animates smoothly

### 7.4 Loading State Cleanup
- [ ] Verify loading states clear after completion
- [ ] Check that loading states clear after errors

## 8. Accessibility Tests

### 8.1 Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Check that all buttons are keyboard accessible
- [ ] Test Enter key on buttons

### 8.2 Screen Reader Support
- [ ] Check ARIA labels are present
- [ ] Verify role attributes are correct
- [ ] Test with screen reader (if available)

### 8.3 Color Contrast
- [ ] Verify text is readable
- [ ] Check that color-blind users can distinguish elements
- [ ] Verify emotion meter colors are distinguishable

## 9. User Experience Flow

### 9.1 Complete User Journey (ASD User)
- [ ] First-time user opens app
- [ ] Accepts privacy notice
- [ ] Selects ASD role
- [ ] Enters message
- [ ] Reviews translation
- [ ] Adjusts tone
- [ ] Copies improved text
- [ ] Views history
- [ ] Performs another translation

### 9.2 Complete User Journey (NT User)
- [ ] Selects NT role
- [ ] Enters ASD person's message
- [ ] Reviews intent analysis
- [ ] Understands potential misunderstanding
- [ ] Checks emotion intensity
- [ ] Saves to history for reference

## 10. Performance Validation

### 10.1 Translation Performance
- [ ] Measure translation response time
- [ ] Verify < 3 seconds (requirement)
- [ ] Test with different text lengths
- [ ] Check network tab for request timing

### 10.2 Tone Adjustment Performance
- [ ] Measure tone adjustment response time
- [ ] Verify < 2 seconds (requirement)
- [ ] Test multiple adjustments

### 10.3 UI Performance
- [ ] Check for smooth scrolling
- [ ] Verify no lag in typing
- [ ] Test rapid button clicks
- [ ] Check memory usage in DevTools

### 10.4 Bundle Size
- [ ] Check network tab for bundle sizes
- [ ] Verify reasonable load times
- [ ] Check for code splitting

## Test Results Summary

### Passed: _____ / Total Tests
### Failed: _____ / Total Tests
### Pass Rate: _____%

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

## Notes
- Test Date: _______________
- Tester: _______________
- Browser: _______________
- Screen Resolution: _______________
- Backend Version: _______________
- Frontend Version: _______________
