/**
 * EnglishTruncationFixStandalone.js
 * 
 * Standalone version that doesn't use imports/exports to avoid bundling issues
 * This module is directly included in the index.html file
 */
const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

// Add to window global scope to avoid module system issues
window.EnglishTruncationFix = {
  /**
   * Attempts to repair JSON content that has been truncated specifically in an English class definition
   * @param {string} jsonContent - The truncated JSON content
   * @param {number} approxErrorPosition - Approximate position where truncation occurred (if known)
   * @returns {string} The repaired JSON string
   */
  fixEnglishTruncation: function(jsonContent, approxErrorPosition = 0) {
    debugLog("Attempting specialized English class truncation fix");

    // Match the specific English truncation patterns
    const truncationPattern = jsonContent.match(/\"subject\"\s*:\s*\"English\"\s*,\s*\"code\"\s*:\s*\"[^\"]*$/);
    
    if (!truncationPattern) {
      // Try alternative pattern without the problematic parenthesis
      const altPattern = jsonContent.match(/\"subject\"\s*:\s*\"English\"\s*,\s*\"code\"\s*:\s*\"/);
      if (!altPattern) {
        debugLog("English truncation pattern not found, skipping specialized fix");
        return jsonContent;
      }
    }
    
    debugLog("Found English class truncation pattern, applying fix");

    // Determine where to cut the JSON to remove the truncated entry
    const truncationPos = jsonContent.lastIndexOf('"subject": "English"');
    if (truncationPos <= 0) {
      debugLog("Could not locate English truncation position");
      return jsonContent;
    }

    // Find the containing array for this truncated entry
    let lastArrayOpen = jsonContent.lastIndexOf('[', truncationPos);
    let lastObjectOpen = jsonContent.lastIndexOf('{', truncationPos);
    
    // We need to find the immediate containing object for the English class
    if (lastObjectOpen < 0 || lastArrayOpen < 0) {
      debugLog("Could not locate containing structures for truncated English entry");
      return jsonContent;
    }
    
    // If the object opening brace comes after the array opening bracket,
    // then this object is inside the array and is our target
    const isObjectInArray = lastObjectOpen > lastArrayOpen;
    
    if (isObjectInArray) {
      // Find where the object containing the truncated entry began
      const objectStart = lastObjectOpen;
      
      // Cut off at array opening, and close the array
      const fixedJson = jsonContent.substring(0, lastArrayOpen + 1) + ']';
      
      // Now we need to find what period this array belongs to, and close its parent structures
      const periodMatch = jsonContent.substring(0, lastArrayOpen).match(/\"(Period \d+|Tutorial)\"\s*:/);
      
      if (periodMatch) {
        // Try to find the day this period belongs to
        const dayMatch = jsonContent.substring(0, lastArrayOpen).match(/\"(Day \d+)\"\s*:/g);
        
        if (dayMatch && dayMatch.length > 0) {
          const lastDay = dayMatch[dayMatch.length - 1];
          // Extract the day name from the match
          const dayName = lastDay.match(/\"(Day \d+)\"/)[1];
          
          debugLog(`Identified truncation in ${periodMatch[1]} of ${dayName}`);
          
          // Check if we need to close the period object
          let closingStructure = '';
          if (jsonContent.indexOf('"' + periodMatch[1] + '"', lastArrayOpen) < 0) {
            // This is the last period in this day
            closingStructure += '}';
            
            // Check if we need to close the day object and classes object
            if (jsonContent.indexOf('"Day', lastArrayOpen) < 0) {
              // No more days after this, close the "classes" object too
              closingStructure += '}}';
            } else {
              // There are more days after this, just close this day
              closingStructure += ',';
            }
          }
          
          return fixedJson + closingStructure;
        }
      }
    }
    
    // If we found valid JSON structures, try to cut at those points
    const lastValidClassEnd = jsonContent.lastIndexOf('"}', truncationPos);
    const lastValidArrayEnd = jsonContent.lastIndexOf(']', truncationPos);
    
    if (lastValidClassEnd > 0 && lastValidArrayEnd > 0) {
      // Choose the closer end point
      const cutPoint = Math.max(lastValidClassEnd, lastValidArrayEnd);
      
      // Cut and try to balance braces
      let fixedJson = jsonContent.substring(0, cutPoint + 1);
      
      // Balance braces
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      
      // Add missing closing braces if needed
      if (openBraces > closeBraces) {
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += '}';
        }
      }
      
      debugLog(`Cut JSON at position ${cutPoint} and balanced braces`);
      return fixedJson;
    }
    
    // As a last resort, just return the original JSON
    return jsonContent;
  },

  /**
   * A more complete recovery for English truncation issues with periods, days, and classes
   * @param {string} jsonContent - The truncated JSON to fix
   * @returns {Object|null} - Parsed JSON object or null if recovery failed
   */
  recoverFromEnglishTruncation: function(jsonContent) {
    try {
      debugLog("Attempting complete recovery from English truncation");
      
      // 1. Extract days array
      const daysMatch = jsonContent.match(/\"days\"\s*:\s*\[[\s\S]*?\]/);
      if (!daysMatch) {
        console.error("Could not find days array for recovery");
        return null;
      }
      
      // 2. Extract periods array
      const periodsMatch = jsonContent.match(/\"periods\"\s*:\s*\[[\s\S]*?\]/);
      if (!periodsMatch) {
        console.error("Could not find periods array for recovery");
        return null;
      }
      
      // 3. Extract complete day blocks before the truncation
      const dayBlockRegex = /\"Day \d+\"\s*:\s*\{[\s\S]*?\}\s*(?=,\s*\"Day|$)/g;
      const dayBlocks = [];
      
      let match;
      while ((match = dayBlockRegex.exec(jsonContent)) !== null) {
        // Only include blocks that end properly
        if (match[0].trim().endsWith('}')) {
          dayBlocks.push(match[0]);
        }
      }
      
      if (dayBlocks.length === 0) {
        console.error("Could not find any complete day blocks for recovery");
        return null;
      }
      
      debugLog(`Found ${dayBlocks.length} complete day blocks for recovery`);
      
      // 4. Reconstruct the JSON
      let fixedJson = '{\n';
      fixedJson += daysMatch[0] + ',\n';
      fixedJson += periodsMatch[0] + ',\n';
      fixedJson += '"classes": {\n';
      
      // Add all complete day blocks
      dayBlocks.forEach((block, index) => {
        fixedJson += block;
        if (index < dayBlocks.length - 1) {
          fixedJson += ',\n';
        }
      });
      
      fixedJson += '\n}\n}';
      
      // 5. Try to parse the reconstructed JSON
      try {
        const parsedJson = JSON.parse(fixedJson);
        debugLog("Successfully recovered from English truncation!");
        return parsedJson;
      } catch (err) {
        console.error("Reconstruction parse error:", err);
        
        // One more attempt: balance braces and brackets
        const openBraces = (fixedJson.match(/\{/g) || []).length;
        const closeBraces = (fixedJson.match(/\}/g) || []).length;
        
        if (openBraces > closeBraces) {
          let balancedJson = fixedJson;
          for (let i = 0; i < openBraces - closeBraces; i++) {
            balancedJson += '\n}';
          }
          
          try {
            const parsedJson = JSON.parse(balancedJson);
            debugLog("Successfully recovered after balancing braces!");
            return parsedJson;
          } catch (finalErr) {
            console.error("All recovery attempts failed:", finalErr);
            return null;
          }
        }
      }
    } catch (e) {
      console.error("Error during English truncation recovery:", e);
      return null;
    }
    
    return null;
  }
};

// Let the main application know this utility is loaded
debugLog("EnglishTruncationFixStandalone loaded successfully");
