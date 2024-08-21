import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import '../css/FilterSettingsModal.css';  // Import a custom CSS file if needed


function FilterSettingsModal({ show, handleClose, alpha, setAlpha, filteringEnabled, setFilteringEnabled }) {
  return (
    <Modal show={show} onHide={handleClose} centered size="sm" dialogClassName="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Filter Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Alpha:</Form.Label>
            <Form.Control
              type="number"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}  // Ensure the onChange works
              min="0.01"
              max="1"
            />
          </Form.Group>
          <Form.Group>
            <Form.Check
              type="switch"
              id="filter-enable-switch"
              label="Enable Filtering"
              checked={filteringEnabled}
              onChange={(e) => setFilteringEnabled(e.target.checked)}  // Ensure the switch works
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FilterSettingsModal;
