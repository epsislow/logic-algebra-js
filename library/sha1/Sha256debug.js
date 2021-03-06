/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* SHA-256 (FIPS 180-4) implementation in JavaScript                  (c) Chris Veness 2002-2019  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/sha256.html                                                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * SHA-256 hash function reference implementation.
 *
 * This is an annotated direct implementation of FIPS 180-4, without any optimisations. It is
 * intended to aid understanding of the algorithm rather than for production use.
 *
 * While it could be used where performance is not critical, I would recommend using the ‘Web
 * Cryptography API’ (developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) for the browser,
 * or the ‘crypto’ library (nodejs.org/api/crypto.html#crypto_class_hash) in Node.js.
 *
 * See csrc.nist.gov/groups/ST/toolkit/secure_hashing.html
 *     csrc.nist.gov/groups/ST/toolkit/examples.html
 */

class Sha256debug {

    /**
     * Generates SHA-256 hash of string.
     *
     * @param   {string} msg - (Unicode) string to be hashed.
     * @param   {Object} [options]
     * @param   {string} [options.msgFormat=string] - Message format: 'string' for JavaScript string
     *   (gets converted to UTF-8 for hashing); 'hex-bytes' for string of hex bytes ('616263' ≡ 'abc') .
     * @param   {string} [options.outFormat=hex] - Output format: 'hex' for string of contiguous
     *   hex bytes; 'hex-w' for grouping hex bytes into groups of (4 byte / 8 character) words.
     * @returns {string} Hash of msg as hex character string.
     *
     * @example
     *   import Sha256 from './sha256.js';
     *   const hash = Sha256.hash('abc'); // 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
     */
    static hash(msg, options) {
        const defaults = { msgFormat: 'string', outFormat: 'hex'};
        const opt = Object.assign(defaults, options);

        // note use throughout this routine of 'n >>> 0' to coerce Number 'n' to unsigned 32-bit integer

        switch (opt.msgFormat) {
            default: // default is to convert string to UTF-8, as SHA only deals with byte-streams
            case 'string':   msg = utf8Encode(msg);       break;
            case 'hex-bytes':msg = hexBytesToString(msg); break; // mostly for running tests
        }

        // constants [§4.2.2]
        const K = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ];

			for (let t=0; t<64; t++) {
				var bn=(K[t] >>> 0)
				   .toString(2)
				   .padStart(32,'0');
				   
				var j = bn.match(/.{1,8}/g);
				bn = j.join(' ');
				dg.add('k['+(t+'').padStart(2)+']= ' + bn);
				dg.lk.addWs('k'+t, dg.dta(K[t]));
			}
			
        // initial hash value [§5.3.3]
        const H = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ];

			
        // PREPROCESSING [§6.2.1]

        msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

        // convert string msg into 512-bit blocks (array of 16 32-bit integers) [§5.2.1]
        const l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
        const N = Math.ceil(l/16);  // number of 16-integer (512-bit) blocks required to hold 'l' ints
        dg.add(N + ' blocks');
        
        const M = new Array(N);     // message M is N×16 array of 32-bit integers

        for (let i=0; i<N; i++) {
            M[i] = new Array(16);
            for (let j=0; j<16; j++) { // encode 4 chars per integer (64 per block), big-endian encoding
                M[i][j] = (msg.charCodeAt(i*64+j*4+0)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16)
                    | (msg.charCodeAt(i*64+j*4+2)<< 8) | (msg.charCodeAt(i*64+j*4+3)<< 0);
            } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
        }
        // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
        // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
        // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
        const lenHi = ((msg.length-1)*8) / Math.pow(2, 32);
        const lenLo = ((msg.length-1)*8) >>> 0;
        M[N-1][14] = Math.floor(lenHi);
        M[N-1][15] = lenLo;
        
        var lenH = Math.floor(lenHi);
        
        dg.add('Msg len: '+ (msg.length -1) + "\n" + dg.dtb(lenH,'-') + dg.dtb(lenLo,'-'));


        // HASH COMPUTATION [§6.2.2]

        for (let i=0; i<N; i++) {
            const W = new Array(64);

            // 1 - prepare message schedule 'W'
            for (let t=0;  t<16; t++) {
				W[t] = M[i][t];
				var bn=(W[t] >>> 0)
				   .toString(2)
				   .padStart(32,'0');
				   
				var j = bn.match(/.{1,8}/g);
				bn = j.join(' ');
				dg.add('W['+(t+'').padStart(2)+']= ' + bn);
				dg.lk.addWs('w'+t, dg.dta(W[t]));
				if (i == 0) {
					if(t==11) {
		//			  var nouncebitsW11a = dg.lk.chgSubBs('w'+ t,12, dg.arCn('w'+t+'.', 12,4));
	//				  dg.lk.add('nbW11a', nouncebitsW11a);
	//				  var nouncebitsW11b = dg.lk.chgSubBs('w'+ t,20, dg.arCn('w'+t+'.', 20,4));
	//				  dg.lk.add('nbW11b', nouncebitsW11b);
	//				  var nouncebitsW11c = dg.lk.chgSubBs('w'+ t,28, dg.arCn('w'+t+'.', 28,4));
	//				  dg.lk.add('nbW11c', nouncebitsW11c);
					} else if(t==12) {
					  var nouncebitsW12a = dg.lk.chgSubBs('w'+ t,4, dg.arCn('n2.',4,4));
					  dg.lk.add('n2', nouncebitsW12a);
//					  var n3 = dg.lk.chgSubBs('w'+ t,12, dg.arCn('n3.',12,4));
//					  dg.lk.add('n3', n3);
					} else if(t==15) {
			//		  var lengthBitsW15 = dg.lk.chgSubBs('w'+ t,23, dg.arCn('w'+t+'.',23,6));
		//			  dg.lk.add('lbW15', lengthBitsW15);
					}
				}
				dg.lk.addSum('w'+t, dg.lk.get('w'+ t));
				dg.add(dg.lk.get('w'+t));
			}
			if (i == 0) {
	//			dg.add('nbW11a='+dg.lk.getWs('nbW11a'));
		//		dg.add('nbW11b='+dg.lk.getWs('nbW11b'));
		//		dg.add('nbW11c='+dg.lk.getWs('nbW11c'));
				dg.add('n2='+dg.lk.getWs('n2'));
//				dg.add('n3='+dg.lk.getWs('n3'));
		//		dg.add('lbW15='+dg.lk.getWs('lbW15'));
			}
			//dg.ts = [11,12];
			
			var dgsum = false;
			
            for (let t=16; t<64; t++) {
				
              W[t] = (Sha256.σ1(W[t-2]) + W[t-7] + Sha256.σ0(W[t-15]) + W[t-16]) >>> 0;
			  
			  if (t <= 64) {
				  //dg.lk.addWs('w'+t,  );
				  
				  dg.sh.sumch('w'+t, [
						dg.sh.p1('w'+(t-2)),
						'w'+(t-7),
						dg.sh.p0('w'+(t-15)),
						'w'+(t-16)
				  ]);
				  
				  dg.add("\n" + 'w'+ t + ' ' + dg.lk.get('w'+ t));
			  }
			  
              
				/*
				if (t == 33) {
					console.log(' Sha256.σ1(W['+ (t-2) + ']) ' +  (Sha256.σ1(W[t-2]) >>> 0).toString(16));
					console.log(' W['+ (t-7) +']' + (W[t-7]  >>> 0).toString(16));
					console.log(' Sha256.σ0(W['+ (t-15) + ']) ' + (Sha256.σ0(W[t-15]) >>> 0).toString(16));
					console.log(' W['+ (t-16) +']' + (W[t-16] >>> 0).toString(16));
				}
				console.log('W['+t+']=' + W[t].toString(16));
				*/
            }
            
            //dg.add('t='+ dg.ts.join(','));

            // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
            let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
			

			let stchar = ('a').charCodeAt(0);
			var stch;
			
			for (let t=0; t<8; t++) {
				stch = String.fromCharCode(stchar + t);
				var bn=(H[t] >>> 0)
				   .toString(2)
				   .padStart(32,'0');
				   
				var j = bn.match(/.{1,8}/g);
				bn = j.join(' ');
				dg.lk.addWs('H'+t, dg.dta(H[t]));
				
				
				dg.lk.addWs(stch, dg.dta(H[t]));
				
				dg.add('H['+t+']= ' + bn);
				
				dg.add("\n" + stch + '= ' + dg.lk.get(stch));
			}
				

            // 3 - main loop (note '>>> 0' for 'addition modulo 2^32')
            for (let t=0; t<64; t++) {
                const T1 = h + Sha256.Σ1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
                const T2 =     Sha256.Σ0(a) + Sha256.Maj(a, b, c);
				
				dg.lk.delSum('T1');
				dg.lk.delSum('T2');
				
				dg.sh.sumch('T1', [
					'h',
					dg.sh.s1('e'),
					dg.sh.cho('e','f','g'),
					'k'+t,
					'w'+t
				]);
				
				//dg.add("\n" + 'T1('+t+') ' + dg.lk.get('T1'));
				
				dg.sh.sumch('T2', [
					dg.sh.s1('a'),
					dg.sh.maj('a','b','c'),
				]);
				  
				//dg.add("\n" + 'T2('+t+') ' + dg.lk.get('T2'));
				
                h = g;
                g = f;
                f = e;
                e = (d + T1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (T1 + T2) >>> 0;

				
				dg.lk.add('h', dg.lk.get('g'));
				dg.lk.add('g', dg.lk.get('f'));
				dg.lk.add('f', dg.lk.get('e'));
				
				dg.sh.sumch('e', ['d', 'T1']);
				
				dg.lk.add('d', dg.lk.get('c'));
				dg.lk.add('c', dg.lk.get('b'));
				dg.lk.add('b', dg.lk.get('a'));
				
				dg.sh.sumch('a', ['T1', 'T2']);
				
				
				if (t == -1) {
					//console.log(' T1=' + (T1 >>> 0).toString(16));
					/*
					console.log('   h=' + h.toString(16));
					console.log('   e=' + e.toString(16));
					console.log('   Σ1(e)=' + Sha256.Σ1(e).toString(16));
					console.log('   e=' + e.toString(16));
					console.log('   f=' + f.toString(16));
					console.log('   g=' + g.toString(16));
					console.log('   Ch(e,f,g)=' + Sha256.Ch(e, f, g).toString(16));
					console.log('   K[t]=' + K[t].toString(16));
					console.log('   W[t]=' + W[t].toString(16));
					*/
					//console.log(' T2=' + (T2 >>> 0).toString(16));
					/*console.log('  a=' + a.toString(16));
					console.log('  b=' + b.toString(16));
					console.log('  c=' + c.toString(16));
					console.log('  Σ0(a)=' + (Sha256.Σ0(a) >>> 0).toString(16));
					console.log('  Maj(a, b, c)=' + (Sha256.Maj(a, b, c) >>> 0).toString(16));*/
					console.log('   K[t]=' + K[t].toString(16));
					
					console.log(' t = '+ t +' a=' + (a >>> 0).toString(16));
					console.log(' t = '+ t +' b=' + (b >>> 0).toString(16));
					console.log(' t = '+ t +' c=' + (c >>> 0).toString(16));
					console.log(' t = '+ t +' d=' + (d >>> 0).toString(16));
					console.log(' t = '+ t +' e=' + (e >>> 0).toString(16));
					console.log(' t = '+ t +' f=' + (f >>> 0).toString(16));
					console.log(' t = '+ t +' g=' + (g >>> 0).toString(16));
					console.log(' t = '+ t +' h=' + (h >>> 0).toString(16));
					
				}
            }

            // 4 - compute the new intermediate hash value (note '>>> 0' for 'addition modulo 2^32')
            H[0] = (H[0]+a) >>> 0;
            H[1] = (H[1]+b) >>> 0;
            H[2] = (H[2]+c) >>> 0;
            H[3] = (H[3]+d) >>> 0;
            H[4] = (H[4]+e) >>> 0;
            H[5] = (H[5]+f) >>> 0;
            H[6] = (H[6]+g) >>> 0;
            H[7] = (H[7]+h) >>> 0;
			
			for (let t=0; t<8; t++) {
				stch = String.fromCharCode(stchar + t);
				dg.sh.sumch('R'+t, [stch, 'H'+t]);
			
				dg.add("\n" + 'R'+t+'('+stch+') = ' + dg.lk.get('R'+t));
			}
        }

        // convert H0..H7 to hex strings (with leading zeros)
        for (let h=0; h<H.length; h++) H[h] = ('00000000'+H[h].toString(16)).slice(-8);

        // concatenate H0..H7, with separator if required
        const separator = opt.outFormat=='hex-w' ? ' ' : '';

        return H.join(separator);

        /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

        function utf8Encode(str) {
            try {
                return new TextEncoder().encode(str, 'utf-8').reduce((prev, curr) => prev + String.fromCharCode(curr), '');
            } catch (e) { // no TextEncoder available?
                return unescape(encodeURIComponent(str)); // monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
            }
        }

        function hexBytesToString(hexStr) { // convert string of hex numbers to a string of chars (eg '616263' -> 'abc').
            const str = hexStr.replace(' ', ''); // allow space-separated groups
            return str=='' ? '' : str.match(/.{2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
        }
    }

    static debug='';

    /**
     * Rotates right (circular right shift) value x by n positions [§3.2.4].
     * @private
     */
    static ROTR(n, x) {
        return (x >>> n) | (x << (32-n));
    }


    /**
     * Logical functions [§4.1.2].
     * @private
     */
    static Σ0(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); }
	static Σ1(x) {return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); }
    static Σ11(x) {
		console.log('     x=' + (x >>> 0).toString(16));
		console.log('     ROTR(6, x)=' + (Sha256.ROTR(6, x) >>> 0).toString(16));
		console.log('     ROTR(11, x)=' + (Sha256.ROTR(11, x) >>> 0).toString(16));
		console.log('     ROTR(25, x)=' + (Sha256.ROTR(25, x) >>> 0).toString(16));
		console.log('     ROTR(6 ^ 11, x)=' + ((Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x)) >>> 0).toString(16));
		
		return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); 
      }
	  
    static σ0(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  }
    static σ1(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); }
    static Ch(x, y, z)  { return (x & y) ^ (~x & z); }          // 'choice'
    static Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); } // 'majority'
	
	static σ11(x) { 
		console.log('   x=' + x.toString(16));
		console.log('   Sha256.ROTR(17, x)=' + Sha256.ROTR(17, x).toString(16));
		console.log('   Sha256.ROTR(19, x)=' + Sha256.ROTR(19, x).toString(16));
		console.log('   (x>>>10)=' + (x>>>10).toString(16));
		return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); 
	}

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

///////////// sha1 ///

/*
var text = 'abc';
var description = 'Sha256 for text `'+text + '` is: '+ Sha256.hash(text, {'outFormat':'hex-w'});

console.log(description);
*/