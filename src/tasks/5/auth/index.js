const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
console.log(togglePassword)
togglePassword.addEventListener('click', () => {
    console.log(passwordInput.type)
    passwordInput.type === 'password' ? passwordInput.type = 'text' : passwordInput.type = 'password';
})