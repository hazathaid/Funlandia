package id.petualanganangka.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import android.os.Bundle;
import android.widget.Toast;
import android.content.DialogInterface;
import androidx.appcompat.app.AlertDialog;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        new AlertDialog.Builder(this)
            .setTitle("Keluar")
            .setMessage("Mau berhenti dulu?")
            .setPositiveButton("Ya", (dialog, which) -> finish())
            .setNegativeButton("Tidak", null)
            .show();
    }
}
