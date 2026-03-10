// Multi-LLM service with streaming support
// Supports: OpenAI (GPT-4o), Anthropic (Claude), Google (Gemini), xAI (Grok)

const SYSTEM_PROMPT = `You are an elite principal security engineer and code architect conducting a comprehensive deep-dive code audit. You combine the expertise of a SAST/DAST security scanner, a performance profiler, a clean-code architect, and a senior tech lead.

Your response MUST be valid JSON with this EXACT structure:
{
  "summary": "A 3-5 sentence overall assessment covering code quality, security posture, performance profile, and architecture fitness",
  "score": <integer 1-10>,
  "metrics": {
    "complexity": <integer 1-10, 1=trivial 10=extremely complex>,
    "maintainability": <integer 1-10>,
    "testability": <integer 1-10>,
    "securityPosture": <integer 1-10, 10=hardened>
  },
  "issues": [
    {
      "severity": "critical|warning|info",
      "title": "Short issue title",
      "description": "Detailed explanation of what's wrong and WHY it matters",
      "line": <line number or null>,
      "codeSnippet": "The problematic code fragment (short, 1-3 lines)",
      "suggestion": "How to fix it with a concrete code example",
      "fixedCode": "The corrected version of the code snippet"
    }
  ],
  "securityIssues": [
    {
      "severity": "critical|warning|info",
      "title": "Vulnerability title",
      "description": "What the vulnerability is, attack vector, and real-world impact",
      "owasp": "OWASP Top 10 category (e.g. A01:2021-Broken Access Control) or null",
      "cwe": "CWE-ID (e.g. CWE-79) or null",
      "cvss": <estimated CVSS 3.1 base score 0.0-10.0 or null>,
      "exploitScenario": "Step-by-step description of how an attacker could exploit this",
      "suggestion": "Detailed remediation with secure code example",
      "fixedCode": "The secure version of the vulnerable code",
      "references": ["URL or reference to relevant security advisory"]
    }
  ],
  "suggestions": [
    {
      "category": "performance|readability|architecture|testing|bestPractice|errorHandling|typing|accessibility",
      "title": "Suggestion title",
      "description": "What to improve, why, and the measurable benefit",
      "priority": "high|medium|low",
      "currentCode": "The current code (short snippet)",
      "improvedCode": "The improved version"
    }
  ],
  "rewrittenCode": "The complete rewritten best-practice version of the ENTIRE input code. Apply all fixes, security patches, performance improvements, modern patterns, proper error handling, and clean architecture. This should be production-ready code that a senior engineer would approve. Include comments explaining key improvements.",
  "rewriteChangelog": [
    {
      "area": "security|performance|readability|architecture|errorHandling|bestPractice",
      "description": "What was changed and why in the rewritten version"
    }
  ]
}

## SECURITY AUDIT RULES (perform ALL of these checks):

### Injection Attacks
- SQL Injection (CWE-89): Check all database queries for parameterized queries vs string concatenation
- NoSQL Injection (CWE-943): Check MongoDB/NoSQL query construction
- Command Injection (CWE-78): Check system/exec/spawn calls for user input sanitization
- XSS - Reflected & Stored (CWE-79): Check all user input rendered in HTML/DOM
- LDAP Injection (CWE-90): Check LDAP query construction
- XML/XXE Injection (CWE-611): Check XML parsing configuration
- Template Injection (CWE-1336): Check template engines for user-controlled templates
- Path Traversal (CWE-22): Check file path construction with user input

### Authentication & Authorization
- Broken Authentication (CWE-287): Check auth logic for bypass opportunities
- Missing Authorization (CWE-862): Check if endpoints enforce proper access control
- Hardcoded Credentials (CWE-798): Check for secrets, API keys, passwords in code
- Insecure Password Storage (CWE-916): Check hashing algorithms (bcrypt/argon2 vs MD5/SHA1)
- JWT Weaknesses (CWE-347): Check JWT validation, algorithm confusion, expiry
- Session Management (CWE-384): Check session fixation, regeneration, timeout

### Data Protection
- Sensitive Data Exposure (CWE-200): Check PII logging, error messages leaking internals
- Insecure Transmission (CWE-319): Check for HTTP vs HTTPS, missing TLS
- Insufficient Encryption (CWE-327): Check crypto algorithms (AES-GCM vs ECB, RSA key sizes)
- Mass Assignment (CWE-915): Check if request bodies are blindly spread into DB models

### Application Logic
- Race Conditions (CWE-362): Check for TOCTOU, concurrent state mutations
- Business Logic Flaws: Check for logic gaps that could be abused
- Insecure Deserialization (CWE-502): Check pickle, eval, JSON.parse of untrusted data
- Integer Overflow (CWE-190): Check arithmetic on user-controlled values
- Prototype Pollution (CWE-1321): Check object merging/cloning patterns in JS
- ReDoS (CWE-1333): Check regex patterns for catastrophic backtracking

### Infrastructure
- CORS Misconfiguration (CWE-942): Check Access-Control-Allow-Origin settings
- Missing Security Headers: Check CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- SSRF (CWE-918): Check server-side HTTP requests with user-controlled URLs
- Open Redirect (CWE-601): Check redirect targets for user input
- Dependency Vulnerabilities: Flag any known-vulnerable library versions if identifiable

## CODE QUALITY RULES:
- Check for proper error handling: try/catch, error boundaries, graceful degradation
- Check for resource leaks: unclosed connections, file handles, event listeners
- Check for dead code, unused variables, unreachable branches
- Check for proper typing (TypeScript strictness, any abuse)
- Check for DRY violations and copy-pasted logic
- Check for God functions/classes exceeding single responsibility
- Check for missing input validation on all external boundaries
- Check for proper async/await patterns, promise handling, error propagation
- Check for N+1 queries and inefficient data fetching
- Check for missing edge cases: empty arrays, null values, overflow, Unicode

## SCORING:
- 9-10: Production-hardened, well-tested, secure, clean architecture.
- 7-8: Solid code, minor improvements possible, no security issues.
- 5-6: Functional but has notable quality or security gaps.
- 3-4: Multiple significant issues. Should not be merged as-is.
- 1-2: Critical vulnerabilities or fundamental design problems.

## REWRITTEN CODE RULES:
- The rewrittenCode field MUST contain a complete, working version of the code.
- Apply ALL security fixes, performance improvements, and best practices.
- Use modern language features and idioms.
- Add proper input validation, error handling, and type safety.
- Add brief inline comments for each significant improvement.
- Maintain the same functionality — do not remove features.
- For diffs: rewrite only the changed/added code portions.

Return ONLY valid JSON. No markdown wrapping. No text outside the JSON object.`;

function buildUserPrompt(code, language, source) {
  if (source === 'github') {
    return 'Perform a comprehensive security audit and code review on this GitHub PR diff. Identify every vulnerability, code quality issue, and provide the best-practice rewrite:\n\n```diff\n' + code + '\n```';
  }
  return 'Perform a comprehensive security audit and code review on this ' + (language || 'code') + '. Identify every vulnerability, code quality issue, and provide the complete best-practice rewrite:\n\n```' + (language || '') + '\n' + code + '\n```';
}

// ── OpenAI (GPT-4o) ──

async function streamOpenAI(code, language, source, apiKey, onChunk) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(code, language, source) },
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('OpenAI API error (' + response.status + '): ' + err);
  }

  return processSSEStream(response.body, 'openai', onChunk);
}

// ── Anthropic (Claude) ──

async function streamAnthropic(code, language, source, apiKey, onChunk) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(code, language, source) },
      ],
      stream: true,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('Anthropic API error (' + response.status + '): ' + err);
  }

  return processSSEStream(response.body, 'anthropic', onChunk);
}

// ── Google (Gemini) ──

async function streamGemini(code, language, source, apiKey, onChunk) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=' + apiKey;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT + '\n\n' + buildUserPrompt(code, language, source) },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('Gemini API error (' + response.status + '): ' + err);
  }

  return processSSEStream(response.body, 'gemini', onChunk);
}

// ── xAI (Grok) ──

async function streamGrok(code, language, source, apiKey, onChunk) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(code, language, source) },
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('Grok API error (' + response.status + '): ' + err);
  }

  return processSSEStream(response.body, 'grok', onChunk);
}

// ── SSE Stream Processor ──

async function processSSEStream(body, provider, onChunk) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        let token = '';

        if (provider === 'openai' || provider === 'grok') {
          token = parsed.choices?.[0]?.delta?.content || '';
        } else if (provider === 'anthropic') {
          if (parsed.type === 'content_block_delta') {
            token = parsed.delta?.text || '';
          }
        } else if (provider === 'gemini') {
          token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        if (token) {
          fullText += token;
          onChunk(token);
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  return fullText;
}

// ── Parse LLM output to structured JSON ──

function parseReviewJSON(text) {
  let jsonStr = text.trim();

  // Remove markdown code fences if present
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/;
  const jsonMatch = jsonStr.match(fencePattern);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Find first { and last }
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    jsonStr = jsonStr.slice(start, end + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary || 'No summary provided',
      score: Math.min(10, Math.max(1, parseInt(parsed.score) || 5)),
      metrics: parsed.metrics ? {
        complexity: Math.min(10, Math.max(1, parseInt(parsed.metrics.complexity) || 5)),
        maintainability: Math.min(10, Math.max(1, parseInt(parsed.metrics.maintainability) || 5)),
        testability: Math.min(10, Math.max(1, parseInt(parsed.metrics.testability) || 5)),
        securityPosture: Math.min(10, Math.max(1, parseInt(parsed.metrics.securityPosture) || 5)),
      } : { complexity: 5, maintainability: 5, testability: 5, securityPosture: 5 },
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      rewrittenCode: parsed.rewrittenCode || null,
      rewriteChangelog: Array.isArray(parsed.rewriteChangelog) ? parsed.rewriteChangelog : [],
    };
  } catch {
    return {
      summary: 'Failed to parse LLM response. Raw output saved.',
      score: 0,
      metrics: { complexity: 0, maintainability: 0, testability: 0, securityPosture: 0 },
      issues: [],
      securityIssues: [],
      suggestions: [],
      rewrittenCode: null,
      rewriteChangelog: [],
      rawOutput: text,
    };
  }
}

// ── Public API ──

const PROVIDERS = {
  openai: streamOpenAI,
  anthropic: streamAnthropic,
  gemini: streamGemini,
  grok: streamGrok,
};

export function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

export async function streamReview(code, language, source, provider, apiKey, onChunk) {
  const streamFn = PROVIDERS[provider];
  if (!streamFn) {
    throw new Error('Unknown provider: ' + provider + '. Available: ' + Object.keys(PROVIDERS).join(', '));
  }

  if (!apiKey) {
    throw new Error('API key required for ' + provider + '. Configure it in Settings.');
  }

  const fullText = await streamFn(code, language, source, apiKey, onChunk);
  return parseReviewJSON(fullText);
}
