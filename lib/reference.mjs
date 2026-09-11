// Independent double-precision quadrature reference. No fixed-point series is reused.
export const pdf = z => Math.exp(-z*z/2) / Math.sqrt(2*Math.PI);
export function cdf(z) {
  const n = 2048, h = Math.abs(z) / n;
  let sum = pdf(0) + pdf(Math.abs(z));
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * pdf(i*h);
  return .5 + Math.sign(z) * sum*h/3;
}
export function invariant(x,y,l) { const z=(y-x)/l; return (y-x)*cdf(z)+l*pdf(z)-y; }
export function quote(x,y,l,amount) {
  const target=invariant(x,y,l); let low=0, high=y;
  for(let i=0;i<100;i++) { const mid=(low+high)/2;
    if(invariant(x+amount,y-mid,l)<=target) low=mid; else high=mid;
  }
  return low;
}
