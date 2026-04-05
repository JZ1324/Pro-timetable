/* EnglishTruncationFix.js - No Module Version */
const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

// This is a duplicate of all the functionality we need, without any import/export code
// Functions are added directly to the window global object

window.EnglishTruncationFix = window.EnglishTruncationFix || {};

window.EnglishTruncationFix.fixEnglishTruncation = function(jsonContent, approxErrorPosition = 0) {
  debugLog("Non-module English truncation fix being used");

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
    // Cut off at array opening, and close the array
    const fixedJson = jsonContent.substring(0, lastArrayOpen + 1) + ']';
    
    // Try to find period and day matches
    const periodMatch = jsonContent.substring(0, lastArrayOpen).match(/\"(Period \d+|Tutorial)\"\s*:/);
    const dayMatch = jsonContent.substring(0, lastArrayOpen).match(/\"(Day \d+)\"\s*:/g);
    
    if (periodMatch && dayMatch && dayMatch.length > 0) {
      // Construct appropriate closing structure
      let closingStructure = '';
      if (jsonContent.indexOf('"' + periodMatch[1] + '"', lastArrayOpen) < 0) {
        closingStructure += '}';
        
        if (jsonContent.indexOf('"Day', lastArrayOpen) < 0) {
          closingStructure += '}}';
        } else {
          closingStructure += ',';
        }
      }
      
      return fixedJson + closingStructure;
    }
  }
  
  // Default approach: cut at valid structure points and balance
  const lastValidClassEnd = jsonContent.lastIndexOf('"}', truncationPos);
  const lastValidArrayEnd = jsonContent.lastIndexOf(']', truncationPos);
  const cutPoint = Math.max(lastValidClassEnd, lastValidArrayEnd);
  
  if (cutPoint > 0) {
    let balancedJson = jsonContent.substring(0, cutPoint + 1);
    
    // Balance braces and brackets
    const openBraces = (balancedJson.match(/\{/g) || []).length;
    const closeBraces = (balancedJson.match(/\}/g) || []).length;
    const openBrackets = (balancedJson.match(/\[/g) || []).length;
    const closeBrackets = (balancedJson.match(/\]/g) || []).length;
    
    // Close arrays and objects
    for (let i = 0; i < openBrackets - closeBrackets; i++) balancedJson += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) balancedJson += '}';
    
    return balancedJson;
  }
  
  return jsonContent;
};

window.EnglishTruncationFix.recoverFromEnglishTruncation = function(content, errorPosition) {
  // Simple implementation
  try {
    if (!content.includes('"subject": "English"')) return null;
    
    // Extract key components
    const daysMatch = content.match(/\"days\"\s*:\s*\[([\s\S]*?)\]/);
    const periodsMatch = content.match(/\"periods\"\s*:\s*\[([\s\S]*?)\]/);
    
    if (!daysMatch || !periodsMatch) return null;
    
    // Build minimal valid JSON
    let fixedJson = '{\n';
    fixedJson += daysMatch[0] + ',\n';
    fixedJson += periodsMatch[0] + ',\n';
    fixedJson += '"classes": {}\n}';
    
    try {
      return JSON.parse(fixedJson);
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
};

debugLog("Non-module EnglishTruncationFix has been loaded in global scope");
