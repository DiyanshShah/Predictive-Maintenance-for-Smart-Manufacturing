import os
import json
import time
import logging
import threading
import csv
import requests
from datetime import datetime
from abc import ABC, abstractmethod

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataConnector(ABC):
    """
    Abstract base class for data connectors to interface with various data sources
    """
    
    def __init__(self, equipment_id, config=None):
        self.equipment_id = equipment_id
        self.config = config or {}
        self.connected = False
        self.last_reading = None
        self.callback = None
        
    @abstractmethod
    def connect(self):
        """Connect to the data source"""
        pass
    
    @abstractmethod
    def disconnect(self):
        """Disconnect from the data source"""
        pass
    
    @abstractmethod
    def read_data(self):
        """Read data from the source"""
        pass
    
    def set_callback(self, callback):
        """Set callback function to be called when new data is available"""
        self.callback = callback
    
    def process_reading(self, data):
        """Process a reading and call the callback if set"""
        timestamp = datetime.utcnow()
        
        reading = {
            "equipment_id": self.equipment_id,
            "timestamp": timestamp.isoformat(),
        }
        
        # Add sensor readings
        if isinstance(data, dict):
            reading.update(data)
        else:
            reading["value"] = data
            
        self.last_reading = reading
        
        # Call the callback if set
        if self.callback:
            self.callback(reading)
        
        return reading


class CSVFileConnector(DataConnector):
    """
    Connector for reading data from CSV files
    """
    
    def __init__(self, equipment_id, file_path, config=None):
        super().__init__(equipment_id, config)
        self.file_path = file_path
        self.interval = self.config.get('interval', 5)  # seconds
        self.loop = False
        self.thread = None
        
    def connect(self):
        """Connect to the CSV file"""
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"CSV file not found: {self.file_path}")
        
        self.connected = True
        logger.info(f"Connected to CSV file: {self.file_path}")
        return True
    
    def disconnect(self):
        """Disconnect from the CSV file"""
        self.connected = False
        self.loop = False
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)
            
        logger.info(f"Disconnected from CSV file: {self.file_path}")
        return True
    
    def read_data(self, loop=False):
        """
        Read data from the CSV file
        If loop is True, read data continuously at the specified interval
        """
        if not self.connected:
            raise ConnectionError("Not connected to CSV file")
        
        self.loop = loop
        
        if loop:
            # Start a thread to read data continuously
            self.thread = threading.Thread(target=self._read_loop)
            self.thread.daemon = True
            self.thread.start()
            return None
        else:
            # Read data once
            return self._read_once()
    
    def _read_once(self):
        """Read all data from the CSV file once"""
        readings = []
        
        with open(self.file_path, 'r') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Process each row
                processed_row = {}
                
                # Parse and convert values
                for key, value in row.items():
                    try:
                        # Convert numeric values
                        processed_row[key] = float(value)
                    except ValueError:
                        # Keep as string for non-numeric values
                        processed_row[key] = value
                
                reading = self.process_reading(processed_row)
                readings.append(reading)
        
        return readings
    
    def _read_loop(self):
        """Read data from the CSV file in a loop"""
        with open(self.file_path, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        row_index = 0
        num_rows = len(rows)
        
        while self.loop and self.connected:
            # Get the current row
            row = rows[row_index]
            
            # Process the row
            processed_row = {}
            for key, value in row.items():
                try:
                    processed_row[key] = float(value)
                except ValueError:
                    processed_row[key] = value
            
            # Process the reading
            self.process_reading(processed_row)
            
            # Move to the next row (loop back to the beginning if necessary)
            row_index = (row_index + 1) % num_rows
            
            # Sleep for the specified interval
            time.sleep(self.interval)


class APIConnector(DataConnector):
    """
    Connector for reading data from a REST API
    """
    
    def __init__(self, equipment_id, api_url, config=None):
        super().__init__(equipment_id, config)
        self.api_url = api_url
        self.headers = self.config.get('headers', {})
        self.auth = self.config.get('auth', None)
        self.interval = self.config.get('interval', 60)  # seconds
        self.loop = False
        self.thread = None
    
    def connect(self):
        """Connect to the API"""
        try:
            # Test the connection
            response = requests.get(
                self.api_url, 
                headers=self.headers,
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            
            self.connected = True
            logger.info(f"Connected to API: {self.api_url}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to connect to API: {str(e)}")
            raise ConnectionError(f"Failed to connect to API: {str(e)}")
    
    def disconnect(self):
        """Disconnect from the API"""
        self.connected = False
        self.loop = False
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)
            
        logger.info(f"Disconnected from API: {self.api_url}")
        return True
    
    def read_data(self, loop=False):
        """
        Read data from the API
        If loop is True, read data continuously at the specified interval
        """
        if not self.connected:
            raise ConnectionError("Not connected to API")
        
        self.loop = loop
        
        if loop:
            # Start a thread to read data continuously
            self.thread = threading.Thread(target=self._read_loop)
            self.thread.daemon = True
            self.thread.start()
            return None
        else:
            # Read data once
            return self._read_once()
    
    def _read_once(self):
        """Read data from the API once"""
        try:
            response = requests.get(
                self.api_url, 
                headers=self.headers,
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            
            # Parse the response
            data = response.json()
            
            # Process the data based on its structure
            if isinstance(data, list):
                # If it's a list, process each item
                readings = []
                for item in data:
                    reading = self.process_reading(item)
                    readings.append(reading)
                return readings
            else:
                # If it's a single item, process it
                reading = self.process_reading(data)
                return [reading]
        
        except Exception as e:
            logger.error(f"Failed to read data from API: {str(e)}")
            raise
    
    def _read_loop(self):
        """Read data from the API in a loop"""
        while self.loop and self.connected:
            try:
                self._read_once()
            except Exception as e:
                logger.error(f"Error in API read loop: {str(e)}")
            
            # Sleep for the specified interval
            time.sleep(self.interval)


# Additional connectors can be implemented for specific protocols

try:
    import pymodbus
    from pymodbus.client import ModbusTcpClient

    class ModbusConnector(DataConnector):
        """
        Connector for reading data from Modbus devices
        """
        
        def __init__(self, equipment_id, host, port=502, config=None):
            super().__init__(equipment_id, config)
            self.host = host
            self.port = port
            self.unit_id = self.config.get('unit_id', 1)
            self.registers = self.config.get('registers', {})
            self.interval = self.config.get('interval', 5)  # seconds
            self.client = None
            self.loop = False
            self.thread = None
        
        def connect(self):
            """Connect to the Modbus device"""
            try:
                self.client = ModbusTcpClient(self.host, self.port)
                connected = self.client.connect()
                
                if connected:
                    self.connected = True
                    logger.info(f"Connected to Modbus device: {self.host}:{self.port}")
                    return True
                else:
                    logger.error(f"Failed to connect to Modbus device: {self.host}:{self.port}")
                    raise ConnectionError(f"Failed to connect to Modbus device: {self.host}:{self.port}")
            
            except Exception as e:
                logger.error(f"Failed to connect to Modbus device: {str(e)}")
                raise ConnectionError(f"Failed to connect to Modbus device: {str(e)}")
        
        def disconnect(self):
            """Disconnect from the Modbus device"""
            if self.client:
                self.client.close()
            
            self.connected = False
            self.loop = False
            
            if self.thread and self.thread.is_alive():
                self.thread.join(timeout=2)
                
            logger.info(f"Disconnected from Modbus device: {self.host}:{self.port}")
            return True
        
        def read_data(self, loop=False):
            """
            Read data from the Modbus device
            If loop is True, read data continuously at the specified interval
            """
            if not self.connected:
                raise ConnectionError("Not connected to Modbus device")
            
            self.loop = loop
            
            if loop:
                # Start a thread to read data continuously
                self.thread = threading.Thread(target=self._read_loop)
                self.thread.daemon = True
                self.thread.start()
                return None
            else:
                # Read data once
                return self._read_once()
        
        def _read_once(self):
            """Read data from the Modbus device once"""
            readings = {}
            
            for name, config in self.registers.items():
                register_type = config.get('type', 'holding')
                address = config.get('address', 0)
                count = config.get('count', 1)
                data_type = config.get('data_type', 'float')
                scaling = config.get('scaling', 1.0)
                
                # Read the register
                if register_type == 'holding':
                    result = self.client.read_holding_registers(address, count, unit=self.unit_id)
                elif register_type == 'input':
                    result = self.client.read_input_registers(address, count, unit=self.unit_id)
                elif register_type == 'coil':
                    result = self.client.read_coils(address, count, unit=self.unit_id)
                elif register_type == 'discrete':
                    result = self.client.read_discrete_inputs(address, count, unit=self.unit_id)
                else:
                    logger.warning(f"Unknown register type: {register_type}")
                    continue
                
                if result.isError():
                    logger.error(f"Error reading register {name}: {result}")
                    continue
                
                # Process the result based on data type
                value = 0
                if register_type in ['holding', 'input']:
                    registers = result.registers
                    
                    if data_type == 'float' and len(registers) >= 2:
                        # IEEE 754 floating point (2 registers)
                        value = self._decode_ieee(registers[0], registers[1])
                    elif data_type == 'int32' and len(registers) >= 2:
                        # 32-bit integer (2 registers)
                        value = (registers[0] << 16) + registers[1]
                    elif data_type == 'int16':
                        # 16-bit integer (1 register)
                        value = registers[0]
                    else:
                        value = registers[0]
                    
                    # Apply scaling
                    value = value * scaling
                
                elif register_type in ['coil', 'discrete']:
                    # Boolean values
                    value = result.bits[0]
                
                readings[name] = value
            
            reading = self.process_reading(readings)
            return [reading]
        
        def _read_loop(self):
            """Read data from the Modbus device in a loop"""
            while self.loop and self.connected:
                try:
                    self._read_once()
                except Exception as e:
                    logger.error(f"Error in Modbus read loop: {str(e)}")
                
                # Sleep for the specified interval
                time.sleep(self.interval)
        
        def _decode_ieee(self, register1, register2):
            """Decode IEEE 754 floating point from two registers"""
            import struct
            import array
            
            temp_array = array.array('H', [register1, register2])
            temp_bytes = temp_array.tobytes()
            value = struct.unpack('>f', temp_bytes)[0]
            return value

except ImportError:
    logger.warning("pymodbus not installed. ModbusConnector will not be available.")

try:
    from opcua import Client

    class OPCUAConnector(DataConnector):
        """
        Connector for reading data from OPC UA servers
        """
        
        def __init__(self, equipment_id, server_url, config=None):
            super().__init__(equipment_id, config)
            self.server_url = server_url
            self.nodes = self.config.get('nodes', {})
            self.interval = self.config.get('interval', 5)  # seconds
            self.client = None
            self.loop = False
            self.thread = None
        
        def connect(self):
            """Connect to the OPC UA server"""
            try:
                self.client = Client(self.server_url)
                self.client.connect()
                
                self.connected = True
                logger.info(f"Connected to OPC UA server: {self.server_url}")
                return True
            
            except Exception as e:
                logger.error(f"Failed to connect to OPC UA server: {str(e)}")
                raise ConnectionError(f"Failed to connect to OPC UA server: {str(e)}")
        
        def disconnect(self):
            """Disconnect from the OPC UA server"""
            if self.client:
                self.client.disconnect()
            
            self.connected = False
            self.loop = False
            
            if self.thread and self.thread.is_alive():
                self.thread.join(timeout=2)
                
            logger.info(f"Disconnected from OPC UA server: {self.server_url}")
            return True
        
        def read_data(self, loop=False):
            """
            Read data from the OPC UA server
            If loop is True, read data continuously at the specified interval
            """
            if not self.connected:
                raise ConnectionError("Not connected to OPC UA server")
            
            self.loop = loop
            
            if loop:
                # Start a thread to read data continuously
                self.thread = threading.Thread(target=self._read_loop)
                self.thread.daemon = True
                self.thread.start()
                return None
            else:
                # Read data once
                return self._read_once()
        
        def _read_once(self):
            """Read data from the OPC UA server once"""
            readings = {}
            
            for name, node_id in self.nodes.items():
                try:
                    # Get the node
                    node = self.client.get_node(node_id)
                    
                    # Read the value
                    value = node.get_value()
                    
                    # Store the value
                    readings[name] = value
                
                except Exception as e:
                    logger.error(f"Error reading node {name} ({node_id}): {str(e)}")
            
            reading = self.process_reading(readings)
            return [reading]
        
        def _read_loop(self):
            """Read data from the OPC UA server in a loop"""
            while self.loop and self.connected:
                try:
                    self._read_once()
                except Exception as e:
                    logger.error(f"Error in OPC UA read loop: {str(e)}")
                
                # Sleep for the specified interval
                time.sleep(self.interval)

except ImportError:
    logger.warning("opcua not installed. OPCUAConnector will not be available.")

# Factory function to create the appropriate connector
def create_connector(equipment_id, connector_type, *args, **kwargs):
    """Create a connector of the specified type"""
    if connector_type == 'csv':
        return CSVFileConnector(equipment_id, *args, **kwargs)
    elif connector_type == 'api':
        return APIConnector(equipment_id, *args, **kwargs)
    elif connector_type == 'modbus' and 'ModbusConnector' in globals():
        return ModbusConnector(equipment_id, *args, **kwargs)
    elif connector_type == 'opcua' and 'OPCUAConnector' in globals():
        return OPCUAConnector(equipment_id, *args, **kwargs)
    else:
        raise ValueError(f"Unknown connector type: {connector_type}") 