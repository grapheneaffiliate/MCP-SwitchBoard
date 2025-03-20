# Placeholder for RabbitMQ/Kafka integration
import asyncio
from datetime import datetime
from typing import Dict, Any, List
import threading
import time

# In-memory task queue for development
tasks_queue = []
running_tasks = {}

def send_task(task_name, task_data):
    print(f"Sending task {task_name} with data {task_data} to queue")
    # In a real application, this would send the task to RabbitMQ/Kafka
    return True

def add_task(task_id: int, server_id: int, command: str):
    """Add a task to the queue"""
    task = {
        "id": task_id,
        "server_id": server_id,
        "command": command,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    tasks_queue.append(task)
    print(f"Added task {task_id} to queue: {command}")
    
    # Start the task processor if it's not already running
    if not hasattr(add_task, "processor_running") or not add_task.processor_running:
        add_task.processor_running = True
        threading.Thread(target=process_tasks, daemon=True).start()
    
    return task

def process_tasks():
    """Process tasks in the queue"""
    from backend import database, crud
    
    print("Task processor started")
    
    while True:
        if tasks_queue:
            task = tasks_queue.pop(0)
            print(f"Processing task {task['id']}: {task['command']}")
            
            # Update task status to running
            db = database.SessionLocal()
            try:
                db_task = crud.get_task(db, task_id=task['id'])
                if db_task:
                    # Update task status to running
                    crud.update_task_status(db, task['id'], "running")
                    
                    # Execute the command
                    from backend.mcp_manager import mcp_manager
                    result = mcp_manager.execute_command(db, task['server_id'], task['command'])
                    
                    # Update task status based on result
                    status = "completed" if result["success"] else "failed"
                    crud.update_task_status(db, task['id'], status, result.get("output", ""))
                    
                    print(f"Task {task['id']} completed with status: {status}")
            except Exception as e:
                print(f"Error processing task {task['id']}: {e}")
                try:
                    crud.update_task_status(db, task['id'], "failed", str(e))
                except:
                    pass
            finally:
                db.close()
        
        # Sleep for a short time before checking for more tasks
        time.sleep(1)
