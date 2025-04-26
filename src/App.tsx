import { Card, CardBody, CardHeader } from '@heroui/react';

function App() {
  return (
    <Card>
      <CardHeader>
        Hello!
      </CardHeader>
      <CardBody>
        <div className='text-red-400'>Body</div>
      </CardBody>
    </Card>
  );
}

export default App;
