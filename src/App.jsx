import React, { useState, useEffect } from 'react';
import { FaDeleteLeft } from "react-icons/fa6";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BsExclamationDiamondFill } from "react-icons/bs";

const Tooltip = ({ text }) => {
  return (
    <div className=" ml-15 absolute left-1/2 transform -translate-x-10 -translate-y-12 mb-2 w-max p-2 bg-purple-600 text-white text-sm rounded-lg opacity-80">
      {text}
    </div>
  );
};

const DraggableInput = ({ index, label, inputValue, onLabelChange, onInputChange, onDeleteInput, moveInput }) => {
  const [, ref] = useDrag({
    type: 'INPUT_ITEM',
    item: { index },
  });

  const [, drop] = useDrop({
    accept: 'INPUT_ITEM',
    hover(item) {
      if (item.index !== index) {
        moveInput(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div ref={(node) => ref(drop(node))} className="flex items-center mb-3">
      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(index, e.target.value)}
        placeholder='Tagging'
        maxLength={10}
        className="flex-grow text-sm p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        style={{ width: '60%' }}
      />
      <input
        type="number"
        value={inputValue}
        onChange={(e) => onInputChange(index, e.target.value)}
        placeholder='minutes'
        maxLength={5}
        className="flex-grow text-sm p-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        style={{ width: '20%' }}
      />
      <button
        onClick={() => onDeleteInput(index)}
        className="text-purple-500 rounded-lg hover:text-red-700 transition border-b-purple-900 ml-1"
      >
        <FaDeleteLeft className='text-3xl' />
      </button>
    </div>
  );
};

const App = () => {
  const [inputs, setInputs] = useState([60, 30]);
  const [labels, setLabels] = useState(['Lunch', 'Break']);
  const [currentTime, setCurrentTime] = useState('');
  const [totalTime, setTotalTime] = useState('22:00');
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [eod, setEod] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = () => {
    setEod(!eod);
  };

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedTime = `${hours > 12 ? hours - 12 : hours || 12}:${minutes < 10 ? '0' + minutes : minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
      setCurrentTime(formattedTime);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setRemainingMinutes(calculateRemainingTime());
  }, [inputs, totalTime]);

  const handleAddInput = () => {
    setInputs([...inputs, '']);
    setLabels([...labels, '']);
  };

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
    console.log(newInputs)
  };


  const handleLabelChange = (index, value) => {
    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
    const newLabels = [...labels];
    newLabels[index] = capitalizedValue;
    setLabels(newLabels);
  };

  const handleDeleteInput = (index) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    const newLabels = labels.filter((_, i) => i !== index);
    setInputs(newInputs);
    setLabels(newLabels);
  };

  const moveInput = (fromIndex, toIndex) => {
    const newInputs = [...inputs];
    const newLabels = [...labels];

    const [movedInput] = newInputs.splice(fromIndex, 1);
    const [movedLabel] = newLabels.splice(fromIndex, 1);

    newInputs.splice(toIndex, 0, movedInput);
    newLabels.splice(toIndex, 0, movedLabel);

    setInputs(newInputs);
    setLabels(newLabels);
  };

  const calculateSchedules = () => {
    const totalInputs = inputs.map(Number);
    const total = totalInputs.reduce((acc, val) => acc + val, 0);
    const [hours, minutes] = totalTime.split(':').map(Number);
    const totalTimeInMinutes = hours * 60 + minutes;
    const adjustedTimeInMinutes = totalTimeInMinutes - total;

    let scheduleTime = adjustedTimeInMinutes;

    let schedules = totalInputs.map((input, index) => {
      const startHours = Math.floor(scheduleTime / 60);
      const startMinutes = scheduleTime % 60;
      const startFormat = `${startHours > 12 ? startHours - 12 : startHours || 12}:${startMinutes < 10 ? '0' + startMinutes : startMinutes} ${startHours >= 12 ? 'PM' : 'AM'}`;

      scheduleTime += input;

      const endHours = Math.floor(scheduleTime / 60);
      const endMinutes = scheduleTime % 60;
      const endFormat = `${endHours > 12 ? endHours - 12 : endHours || 12}:${endMinutes < 10 ? '0' + endMinutes : endMinutes} ${endHours >= 12 ? 'PM' : 'AM'}`;

      return { time: endFormat, input, label: labels[index] || `Label ${index + 1}`, start: startFormat };
    });

    return { total, adjustedTimeInMinutes, schedules };
  };

  const calculateRemainingTime = () => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const [endHours, endMinutes] = totalTime.split(':').map(Number);
    const endTimeInMinutes = endHours * 60 + endMinutes;

    const totalInputs = inputs.map(Number);
    const total = totalInputs.reduce((acc, val) => acc + val, 0);
    const remainingTime = endTimeInMinutes - currentTimeInMinutes - total;

    return remainingTime > 0 ? remainingTime : 0;
  };

  const { total, schedules } = calculateSchedules();

  const formatRemainingTime = (remaining) => {
    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;
  };


  const formatTotalTime = (total) => {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const addTotal = (e) => {
    setTotalTime(e.target.value)}

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div className='mx-auto sm:flex items-center justify-center min-h-screen bg-purple-100'>
          <section className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md" style={{ width: '100%' }}>
            <h1 className="bg-violet-600 text-white text-3xl font-bold mb-6 text-center rounded-lg shadow-md">Indirect Scheduler</h1>
            <div className="mb-4">
              <label className="block mb-2 text-lg text-gray-700">End Shift:</label>
              <input
                type="time"
                value={totalTime}
                onChange={addTotal}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
              />
            </div>
            <div className="text-lg mb-3">Current Time: <span className="font-semibold">{currentTime}</span></div>
            <div className="text-lg mb-3">Remaining Time: <span className="font-semibold">{formatRemainingTime(remainingMinutes)}</span></div>
            {inputs.map((inputValue, index) => (
              <DraggableInput
                key={index}
                index={index}
                label={labels[index]}
                inputValue={inputValue}
                onLabelChange={handleLabelChange}
                onInputChange={handleInputChange}
                onDeleteInput={handleDeleteInput}
                moveInput={moveInput}
              />
            ))}
            <div className="flex justify-center mb-5">
              <button
                onClick={handleAddInput}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
              >
                Add Indirect
              </button>
            </div>

            <div className='flex center-item mb-2 '>
              <div className="text-xl text-gray-800 font-bold">Total Indirect: <span className="text-violet-600">{formatTotalTime(total)}  </span> </div>
              <div
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="relative mt-2"
              >
                <BsExclamationDiamondFill className="text-purple-500 hover:text-purple-600 ml-2 text-base" />
                {showTooltip && <Tooltip text="Tip: You can drag and drop the inputs " />}
              </div>
            </div>

            <section className='bg-violet-100 rounded-lg p-4 shadow-md'>
              <div className="flex justify-between items-center mb-2">
                <div className="text-lg font-bold">{eod ? 'Schedule' : 'EOD'}</div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={eod}
                    onChange={handleToggle}
                    id="switch"
                    className="hidden"
                  />
                  <label
                    htmlFor="switch"
                    className={`relative inline-flex items-center cursor-pointer w-12 h-6 rounded-full transition duration-200 ease-in-out ${eod ? 'bg-yellow-500' : 'bg-green-500'}`}
                  >
                    <span
                      className={`transform transition duration-200 ease-in-out inline-block w-6 h-6 bg-white rounded-full shadow ${eod ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                  </label>
                </div>
              </div>
              <section className='bg-violet-200 rounded-lg p-4 shadow-md'>
                {schedules.map((schedule, index) => (
                  <div key={index} className="text-lg mb-1">
                    <span className="font-semibold">{schedule.label}</span>: {eod ? `${schedule.start} - ${schedule.time} (${schedule.input > 1 ? schedule.input + ' mins' : schedule.input + ' min'})` : (schedule.input / 60).toFixed(2)}
                  </div>
                ))}
                <div className='text-lg mb-1'>
                  <span className='font-semibold'>{eod ? '' : 'Prod: '}</span><span>{eod ? '' : `${((540 - total) / 60).toFixed(2)}`}</span>
                </div>
              </section>
            </section>
          </section>
        </div>

        <footer className='bg-purple-800 text-white text-center py-2 mt-3'>
          <p>Created by: Truda 🤪</p>
          <p>Copyright © 2024. All rights reserved.</p>
        </footer>
      </div>
    </DndProvider>
  );
};

export default App;
