<?php
// core/session.php
session_start();
function is_logged_in()
{
    return isset($_SESSION['user_id']);
}
function require_login()
{
    if (!is_logged_in()) {
        header('Location: /primary_shools/login.php');
        exit;
    }
}
function logout()
{
    session_unset();
    session_destroy();
    header('Location: /primary_shools/login.php');
    exit;
}
