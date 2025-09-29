import { Box, Typography } from "@mui/material";
import BitacoraList from "./BitacoraList";

export default function RegistrarBitacoraPage() {
  return (
    <Box sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        CU27 · Registrar Bitácora
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <BitacoraList />
      </Box>
    </Box>
  );
}
