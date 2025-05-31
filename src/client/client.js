const soap = require('soap');

// Define the service endpoint
const url = 'http://localhost:8080/Greeter'; // Replace with actual service URL

// Create a client object
soap.createClient(url, (err, client) => {
  if (err) {
    console.error('Error creating SOAP client:', err);
    return;
  }

  // Define the arguments for the Greet operation
  const args = { name: 'John Doe' }; // Replace with desired name

  // Call the Greet operation
  client.Greet(args, (err, response) => {
    if (err) {
      console.error('Error calling Greet operation:', err);
      return;
    }

    // Access the greeting message from the response
    const greeting = response.greeting;

    console.log(greeting); // Output: Hello, John Doe!
  });
});
