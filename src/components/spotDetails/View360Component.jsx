import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Button, Spinner, Alert, Modal } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { Viewer } from "photo-sphere-viewer";
import { GyroscopePlugin } from "photo-sphere-viewer/dist/plugins/gyroscope";
import "photo-sphere-viewer/dist/photo-sphere-viewer.css";
import NoSleep from "nosleep.js";

const View360Component = ({ spotId }) => {
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);

  const fetchViewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/spots/${spotId}/360-view`, {
        timeout: 5000,
      });

      if (!response.data?.imageUrl) {
        throw new Error("No 360° image URL found");
      }

      // Verify image accessibility
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = response.data.imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          console.error("Image load error:", e);
          reject(new Error("Failed to load 360° image"));
        };
      });

      setViewData(response.data);
    } catch (err) {
      setError(err.message || "Failed to load 360° view");
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  useEffect(() => {
    if (spotId) fetchViewData();
  }, [spotId, fetchViewData]);

  const requestGyroPermission = async () => {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        await DeviceMotionEvent.requestPermission();
        return true;
      } catch (err) {
        setError("Gyroscope permission denied");
        return false;
      }
    }
    return true; // Android typically doesn't require explicit permission
  };

  const handleOpenModal = async () => {
    const permissionGranted = await requestGyroPermission();
    if (permissionGranted) setShowModal(true);
  };

  const handleModalEntered = async () => {
    if (!viewData?.imageUrl || !viewerRef.current) return;

    try {
      // Check container dimensions
      const container = viewerRef.current;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        throw new Error("Container has zero dimensions");
      }

      // Check image accessibility
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = viewData.imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) =>
          reject(new Error(`Image load failed: ${e.message}`));
      });

      // Initialize NoSleep
      const noSleep = new NoSleep();

      // Initialize viewer with GyroscopePlugin
      viewerInstance.current = new Viewer({
        container: viewerRef.current,
        panorama: viewData.imageUrl,
        loadingImg:
          "https://photo-sphere-viewer.js.org/assets/photosphere-logo.gif",
        loadingTxt: "Loading 360° view...",
        size: { width: "100%", height: "100%" },
        navbar: [
          "zoom",
          "move",
          "fullscreen",
          "caption",
          "autorotate",
          {
            id: "gyroscope",
            title: "Enable VR Mode (Gyroscope)",
            content: "VR",
            visible: window.DeviceOrientationEvent !== undefined,
          },
        ],
        plugins: [
          [
            GyroscopePlugin,
            {
              autostart: false,
              moveSpeed: 1.0,
              lockUserInteraction: false,
            },
          ],
        ],
      });

      // Handle NoSleep for VR mode
      viewerInstance.current.on("start-gyroscope", () => {
        noSleep.enable();
      });
      viewerInstance.current.on("stop-gyroscope", () => {
        noSleep.disable();
      });
    } catch (err) {
      console.error("Initialization failed:", err);
      setError(`Viewer error: ${err.message}`);
    }
  };

  const handleModalExit = () => {
    if (viewerInstance.current) {
      viewerInstance.current.destroy();
      viewerInstance.current = null;
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <Card.Body className="text-center py-3">
          <Card.Title className="d-flex align-items-center justify-content-center">
            <i
              className="bi bi-camera-video text-primary me-2"
              aria-hidden="true"
            />
            360° View
          </Card.Title>
          {loading && <Spinner animation="border" size="sm" className="me-2" />}
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
              <Button
                variant="link"
                onClick={fetchViewData}
                className="p-0 ms-2"
              >
                Retry
              </Button>
            </Alert>
          )}
          {!error && !loading && !viewData?.imageUrl && (
            <p className="text-muted small mb-0">
              No 360° view available for this spot.
            </p>
          )}
          {!error && !loading && viewData?.imageUrl && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleOpenModal}
              aria-label="Open 360° view"
            >
              <i className="bi bi-arrows-fullscreen me-2" aria-hidden="true" />
              View in 360°
            </Button>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
        onEntered={handleModalEntered}
        onExited={handleModalExit}
        fullscreen="md-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>360° View</Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="p-0 m-0"
          style={{
            height: "80vh",
            minHeight: "400px",
            maxHeight: "100vh",
            position: "relative",
          }}
        >
          <div
            ref={viewerRef}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
          {(loading || !viewData) && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
              }}
            >
              <Spinner animation="border" />
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

View360Component.propTypes = {
  spotId: PropTypes.string.isRequired,
};

export default View360Component;
