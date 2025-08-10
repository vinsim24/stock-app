import { createChart } from 'lightweight-charts';

// Test what methods are available
const container = document.createElement('div');
document.body.appendChild(container);

try {
  const chart = createChart(container, { width: 400, height: 300 });
  console.log('Chart object:', chart);
  console.log('Chart methods:', Object.getOwnPropertyNames(chart));
  console.log('Chart prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)));
  
  // Test available series methods
  console.log('Available add methods:', Object.getOwnPropertyNames(chart).filter(name => name.startsWith('add')));
  
} catch (error) {
  console.error('Error:', error);
}
