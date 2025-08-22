import { useLocation } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // For animations
import PropTypes from "prop-types";

// Custom 404 SVG for better visuals (you can replace with your own asset)
const NotFoundSVG = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="100"
      cy="100"
      r="90"
      stroke="#6c757d"
      strokeWidth="10"
      fill="none"
      opacity="0.2"
    />
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dy=".3em"
      fontSize="60"
      fill="#6c757d"
    >
      404
    </text>
  </svg>
);

const NotFound = ({ customMessage }) => {
  const location = useLocation();

  // Animation variants for smooth entrance
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  // Dynamic message based on location or custom prop
  const defaultMessage = `The page at "${location.pathname}" doesn't exist or has been moved. Let's get you back on track!`;
  const message = customMessage || defaultMessage;

  return (
    <Container className="py-5 text-center" aria-label="Page Not Found">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Row className="justify-content-center">
          <Col md={6}>
            <div className="mb-4">
              <NotFoundSVG />
              <h1 className="mt-4 mb-3 fw-bold">Page Not Found</h1>
              <p
                className="text-muted mb-4 px-3"
                style={{ maxWidth: "400px", margin: "0 auto" }}
              >
                {message}
              </p>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  as={Link}
                  to="/home"
                  variant="primary"
                  size="lg"
                  className="px-4"
                  aria-label="Return to Home Page"
                >
                  Back to Home
                </Button>
              </motion.div>
            </div>
          </Col>
        </Row>
      </motion.div>
    </Container>
  );
};

// PropTypes for type checking
NotFound.propTypes = {
  customMessage: PropTypes.string,
};

export default NotFound;
