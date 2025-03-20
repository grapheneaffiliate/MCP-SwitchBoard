import psutil
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_cpu_usage():
    return psutil.cpu_percent(interval=1)

def get_ram_usage():
    ram = psutil.virtual_memory()
    return ram.percent

def get_disk_usage():
    disk = psutil.disk_usage('/')
    return disk.percent

def get_network_activity():
    net = psutil.net_io_counters()
    return {"bytes_sent": net.bytes_sent, "bytes_recv": net.bytes_recv}

def log_event(message, level=logging.INFO):
    logging.log(level, message)
